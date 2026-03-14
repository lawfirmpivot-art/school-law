/**
 * 학교폭력 해설집 CMS - Supabase 데이터베이스 연동 버전
 */

// Supabase 설정
const SUPABASE_URL = 'https://aedobxcpyiwzvrrofben.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Wks4VkCD8HwEDUtn1JlQYA_iljFqECJ'; // anon key

// 전역 supabase 라이브러리 확인 및 클라이언트 초기화
let _supabaseClient = null;
try {
    if (window.supabase) {
        _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error('Supabase 초기화 실패:', e);
}

const STORAGE_KEY = 'school_law_posts';
const ADMIN_KEY = 'school_law_admin';

const CMS = {
    // 포스트 목록 가져오기 (비동기)
    getPosts: async () => {
        if (!_supabaseClient) {
            console.error('Supabase 클라이언트가 설정되지 않았습니다.');
            return [];
        }
        try {
            const { data, error } = await _supabaseClient
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(post => ({
                ...post,
                title: post.title ? post.title.replace(/<\/?[^>]+(>|$)/g, "").trim() : "제목 없음",
                summary: post.summary ? post.summary.replace(/<\/?[^>]+(>|$)/g, "").trim() : "요약 없음"
            }));
        } catch (err) {
            console.error('데이터를 가져오는데 실패했습니다:', err);
            return [];
        }
    },

    // 단일 포스트 가져오기 (비동기)
    getPost: async (id) => {
        if (!_supabaseClient || !id) return null;
        try {
            const { data, error } = await _supabaseClient
                .from('posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('포스트를 가져오는데 실패했습니다:', err);
            return null;
        }
    },

    // 카테고리 목록 가져오기 (비동기)
    getCategories: async () => {
        try {
            const posts = await CMS.getPosts();
            const cats = posts.map(p => p.category).filter(Boolean);
            return [...new Set(cats)];
        } catch (e) {
            return ['일반'];
        }
    },

    // 포스트 저장 또는 업데이트 (비동기)
    savePost: async (post) => {
        if (!_supabaseClient) return null;
        try {
            const isUpdate = !!post.id;
            const postData = { ...post };

            if (!isUpdate) {
                postData.id = Date.now().toString();
                postData.views = 0;
                postData.created_at = new Date().toISOString();
            }

            const { data, error } = isUpdate
                ? await _supabaseClient.from('posts').update(postData).eq('id', post.id).select().single()
                : await _supabaseClient.from('posts').insert([postData]).select().single();

            if (error) {
                console.warn('저장 후 데이터를 가져오는 데 실패했습니다(RLS 등). 로컬 데이터를 반환합니다:', error);
            }
            return data || postData;
        } catch (err) {
            console.error('저장 실패:', err);
            throw err; // 상세 페이지에서 처리하도록 에러 던짐
        }
    },

    // 포스트 삭제 (비동기)
    deletePost: async (id) => {
        if (!_supabaseClient || !id) return;
        try {
            const { error } = await _supabaseClient
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) {
                console.warn('삭제 중 오류 발생(RLS 등):', error);
                throw error;
            }
            return true;
        } catch (err) {
            console.error('삭제 실패:', err);
            throw err;
        }
    },

    // 조회수 증가 (비동기)
    incrementView: async (id) => {
        if (!_supabaseClient || !id) return;
        try {
            const { data: post } = await _supabaseClient.from('posts').select('views').eq('id', id).single();
            if (post) {
                await _supabaseClient.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', id);
            }
        } catch (err) {
            console.warn('조회수 업데이트 무시됨:', err);
        }
    },

    // 관리자 확인 (Google Login + 로컬 관리자 키 체크)
    isAdmin: async () => {
        // 1. 로컬 스토리지 우선 확인
        if (localStorage.getItem(ADMIN_KEY) === 'true') return true;

        if (!_supabaseClient) return false;
        
        // 2. 현재 Supabase 세션 확인
        const { data: { session } } = await _supabaseClient.auth.getSession();
        
        // 3. 로그인된 사용자가 있고, 지정된 관리자 이메일인지 확인
        if (session && session.user && session.user.email === 'lawfirmpivot@gmail.com') {
            return true;
        }
        
        return false;
    },

    // 비밀번호 기반 로그인 (비상용)
    loginWithPassword: async (password) => {
        if (password === 'lawfirmpivot@gmail.com') {
            localStorage.setItem(ADMIN_KEY, 'true');
            return true;
        }
        return false;
    },

    // 구글 로그인 처리
    login: async () => {
        if (!_supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
            alert('인증 시스템을 불러오지 못했습니다. 인터넷 연결이나 브라우저 설정을 확인해주세요.');
            return;
        }

        try {
            console.log('구글 로그인 시작...');
            const { data, error } = await _supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });
            
            if (error) {
                console.error('Supabase Auth 에러:', error);
                alert('로그인 시도 중 오류가 발생했습니다: ' + error.message);
                throw error;
            }
        } catch (error) {
            console.error('로그인 예외 발생:', error);
            alert('로그인 시스템 연결에 실패했습니다: ' + error.message);
            throw error;
        }
    },

    // 세션 정보 가져오기
    getSession: async () => {
        if (!_supabaseClient) return null;
        const { data: { session } } = await _supabaseClient.auth.getSession();
        return session;
    },

    // 로그아웃 처리
    logout: async () => {
        localStorage.removeItem(ADMIN_KEY);
        if (!_supabaseClient) return;
        await _supabaseClient.auth.signOut();
        window.location.reload();
    }
};

// 전역 변수로 노출 보장
window.CMS = CMS;
