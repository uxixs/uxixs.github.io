# uxixs.github.io

직접 만든 논문과 작업물을 모아 두는 아카이브 페이지입니다. https://uxixs.github.io

## 폴더 구조

```
index.html   페이지 뼈대 (보통 수정할 필요 없음)
style.css    디자인
main.js      data.js 내용을 화면에 그려 주는 코드
data.js      ★ 내용은 전부 여기서 수정
papers/      PDF 등 파일
images/      미리보기 이미지
```

## 작업 추가하기

1. PDF는 `papers/`, 이미지는 `images/` 폴더에 넣습니다. (없어도 됨)
2. `data.js`의 `works: [ ... ]` 안에 항목을 하나 추가합니다.

```js
{
  type: "paper",              // "paper" 또는 "project"
  title: "제목",
  year: 2026,
  description: "설명",
  file: "papers/my-paper.pdf",
  link: "",
  code: "",
  image: "images/preview.png",
  tags: ["Physics"]
},
```

- 항목 사이에 쉼표(`,`)를 꼭 넣어 주세요.
- 최신 연도가 위로 자동 정렬되고, 번호도 자동으로 붙습니다.
- paper와 project가 둘 다 있으면 위쪽에 종류별 필터가 생깁니다.

## 올리기

```bash
git add .
git commit -m "Add new work"
git push
```

1~2분 뒤 사이트에 반영됩니다.

## 주의

- 파일 하나당 100MB를 넘으면 push가 거부됩니다. 큰 파일은 외부 링크로 연결하세요.
- 공개 저장소이므로 올린 파일은 누구나 받을 수 있습니다. 학회/저널에 낸 논문은 공개 가능 여부를 확인하세요.
