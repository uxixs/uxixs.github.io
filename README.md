# Portfolio

논문과 작업물을 모아 두는 정적 사이트입니다. GitHub Pages에 올리면 바로 동작합니다.

## 폴더 구조

```
index.html   페이지 뼈대 (보통 수정할 필요 없음)
style.css    디자인
main.js      data.js 내용을 화면에 그려 주는 코드
data.js      ★ 내용은 전부 여기서 수정
papers/      논문 PDF
images/      프로필 사진, 프로젝트 썸네일
```

## 논문 추가하기

1. PDF를 `papers/` 폴더에 넣습니다. (예: `papers/my-paper.pdf`)
2. `data.js`의 `papers: [ ... ]` 안에 항목을 하나 추가합니다.

```js
{
  title: "논문 제목",
  authors: "홍길동, 김철수",
  venue: "학회/저널/보고서 이름",
  year: 2026,
  abstract: "요약",
  pdf: "papers/my-paper.pdf",
  link: "",
  code: "",
  tags: ["Physics"]
},
```

항목 사이에 쉼표(`,`)를 꼭 넣어 주세요. 최신 연도가 위로 자동 정렬됩니다.

## 작업물 추가하기

1. 썸네일 이미지를 `images/`에 넣습니다. (없어도 됨)
2. `data.js`의 `projects: [ ... ]` 안에 항목을 추가합니다.

```js
{
  title: "프로젝트 이름",
  description: "설명",
  image: "images/project.png",
  year: 2026,
  demo: "",
  code: "https://github.com/your-id/project",
  tags: ["Python"]
},
```

태그가 2개 이상이면 Projects 옆에 필터 버튼이 자동으로 생깁니다.

## GitHub Pages에 올리기

1. GitHub에서 새 저장소를 `uxixs.github.io` 이름으로 만듭니다. (Public)
2. 이 폴더에서:

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/uxixs/uxixs.github.io.git
git push -u origin main
```

3. 저장소 **Settings → Pages → Build and deployment**에서
   Source: `Deploy from a branch`, Branch: `main` / `(root)` 선택 후 Save.
4. 1~2분 뒤 `https://uxixs.github.io` 에서 확인합니다.

이후에는 내용을 고치고 아래만 실행하면 반영됩니다.

```bash
git add .
git commit -m "Add new paper"
git push
```

## 주의

- 파일 하나당 100MB를 넘으면 push가 거부됩니다. 큰 파일은 외부 링크로 연결하세요.
- 공개 저장소이므로 올린 PDF는 누구나 다운로드할 수 있습니다. 공개 전 저작권(학회/저널 정책)을 확인하세요.
- 로컬에서 미리 보려면 `index.html`을 브라우저로 그냥 열면 됩니다.
