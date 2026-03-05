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

    isAdmin: async () => {
        if (!_supabaseClient) return false;
        try {
            const { data: { session }, error } = await _supabaseClient.auth.getSession();
            if (session && session.user && session.user.email === 'lawfirmpivot@gmail.com') {
                return true;
            }
            return false;
        } catch (e) {
            console.error('Session check failed:', e);
            return false;
        }
    },

    login: async () => {
        if (!_supabaseClient) return false;
        try {
            const { data, error } = await _supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/admin.html'
                }
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Login failed:', e);
            return false;
        }
    },

    logout: async () => {
        if (!_supabaseClient) return;
        try {
            const { error } = await _supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.reload();
        } catch (e) {
            console.error('Logout failed:', e);
        }
    }
};

// 전역 변수로 노출 보장
window.CMS = CMS;
