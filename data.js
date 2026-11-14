// =============================================================
//  이 파일만 고치면 사이트 내용이 바뀝니다.
//
//  새 작업 추가: works 배열 맨 위에 { ... } 한 덩어리를 복사해서 붙이고 내용 수정
//    type   : "paper" (논문/글) 또는 "project" (만든 것)
//    file   : PDF 등 파일 → papers/ 폴더에 넣고 경로 적기
//    image  : 미리보기 이미지 → images/ 폴더에 넣고 경로 적기
//    link / code : 외부 주소(데모 등), 코드 저장소
//    venue  : (선택) 어디에 낸 글인지, 어떤 성격의 작업인지 한 마디. 없어도 됩니다.
//  쓰지 않는 항목은 "" 로 두거나 아예 지우면 화면에 안 나옵니다.
//  최신 연도가 위로 자동 정렬되고, 같은 해 안에서는 위에 적은 것이 먼저 나옵니다.
// =============================================================

window.SITE = {
  title: "uxixs",
  subtitle: "Works archive",

  works: [
    {
      type: "paper",
      title: "예시 논문 제목",
      year: 2026,
      description: "무엇을 연구했는지 두세 문장으로 적습니다.",
      file: "papers/example.pdf",
      link: "",
      code: "",
      image: "",
      tags: ["Physics", "Simulation"]
    },
    {
      type: "project",
      title: "예시 프로젝트",
      year: 2026,
      description: "무엇을 만들었고 어떤 문제를 풀었는지 짧게 적습니다.",
      file: "",
      link: "",
      code: "https://github.com/uxixs",
      image: "",
      tags: ["Python", "Web"]
    }
  ]
};
