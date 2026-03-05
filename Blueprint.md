# Blueprint: 학교폭력 해설집 동적 콘텐츠 관리 시스템(CMS) 구축 계획서

## 1. 프로젝트 목표
- **동적 블로그 시스템 구축**: 단순 정적 페이지를 넘어 사용자가 직접 글을 작성, 수정, 삭제할 수 있는 시스템 구현.
- **스크린샷 디자인 완벽 재현**: 제공된 리스트 및 잡지형 레이아웃을 바탕으로 `DESIGN.md`의 프리미엄 톤앤매너 유지.
- **전면 한글화**: 모든 인터페이스와 샘플 콘텐츠를 한글로 구성하여 국내 사용자 가독성 극대화.

## 2. 기술 스택 (Tech Stack)
- **Frontend Core**: HTML5, Vanilla JavaScript (데이터 바인딩 및 상태 관리)
- **Styling**: Tailwind CSS (CDN), Typography 플러그인
- **Data Persistence**: `localStorage` (서버 없이도 브라우저 내에서 글 작성/수정/삭제 상태 유지 가능)

## 3. 상세 페이지 설계
- **`blog.html` (개편)**: '정의에 대한 통찰' 테마. 큰 이미지와 핵심 태그가 포함된 잡지형 리스트. (스크린샷 1번 스타일)
- **`news.html` (개편)**: '최신 분석' 테마. 화살표 아이콘과 저자 정보가 포함된 깔끔한 리스트. (스크린샷 2번 스타일)
- **`admin.html` (신규)**: 게시글 관리 대시보드. 작성된 글 목록 확인 및 수정/삭제 버튼 배치.
- **`editor.html` (신규)**: 글쓰기 및 수정 전용 에디터 페이지. 제목, 요약, 본문, 이미지 경로 입력 폼 제공.

## 4. 데이터 구조 (Schema)
```json
{
  "id": "timestamp",
  "type": "blog | news",
  "title": "제목",
  "summary": "요약 전문",
  "content": "상세 본문(HTML/Markdown)",
  "tag": "분류 태그",
  "author": "김경수 변호사",
  "date": "YYYY.MM.DD",
  "image": "이미지 경로"
}
```

## 5. 단계별 마이크로 작업 분할
- **Step 1**: 외부 기억 장치(Blueprint, Progress_Board) CMS 사양으로 업데이트.
- **Step 2**: 한글화된 `blog.html` (잡지형) UI 리디자인 및 데이터 렌더링 스크립트 작성.
- **Step 3**: 한글화된 `news.html` (리스트형) UI 리디자인 및 데이터 렌더링 스크립트 작성.
- **Step 4**: 관리자 페이지(`admin.html`) 및 에디터(`editor.html`) 구현 (CRUD 로직 포함).
- **Step 5**: 전 기기 반응형 및 한글 타이포그래피 최종 QC.
