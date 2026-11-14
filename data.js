// =============================================================
//  이 파일만 고치면 사이트 내용이 바뀝니다.
//
//  새 작업 추가: works 배열 맨 위에 { ... } 한 덩어리를 복사해서 붙이고 내용 수정
//    type   : "paper" (논문/글) 또는 "project" (만든 것)
//    file   : PDF 등 파일 → papers/ 폴더에 넣고 경로 적기
//    image  : 미리보기 이미지 → images/ 폴더에 넣고 경로 적기
//    link / code : 외부 주소(데모 등), 코드 저장소
//    venue  : (선택) 어디에 낸 글인지, 어떤 성격의 작업인지 한 마디. 없어도 됩니다.
//    subtitle : (선택) 제목 아래 작게 나오는 한 줄 (영문 제목 등)
//    files  : (선택) 언어별 PDF가 여러 개일 때 file 대신 사용
//             files: [{ label: "한국어", path: "papers/a-ko.pdf" }, { label: "English", path: "papers/a-en.pdf" }]
//  PDF는 사이트 안에서 바로 읽기(뷰어)와 다운로드가 모두 됩니다.
//  쓰지 않는 항목은 "" 로 두거나 아예 지우면 화면에 안 나옵니다.
//  최신 연도가 위로 자동 정렬되고, 같은 해 안에서는 위에 적은 것이 먼저 나옵니다.
// =============================================================

window.SITE = {
  title: "uxixs",
  subtitle: "Works archive",

  works: [
    {
      type: "paper",
      title: "인공지능 시대 분배제도의 순환구조 분석",
      subtitle: "A Circular-Flow Analysis of Distribution Institutions in the Age of AI",
      year: 2026,
      description: "AI 기업 수익의 일부를 기본소득으로 돌려주는 분배구조가 총수요를 유지할 수 있는지 단순 순환모형으로 탐색했습니다. 국내 순환모형, 선진국·후진국 사이 잉여 이전의 '추출의 역설', 기술추격 모형을 결합하고 저·중소득국 국제수지 자료로 검정했습니다.",
      files: [
        { label: "한국어", path: "papers/ai-distribution-ko.pdf" },
        { label: "English", path: "papers/ai-distribution-en.pdf" }
      ],
      link: "",
      code: "",
      image: "",
      tags: ["AI", "기본소득", "유효수요", "종속이론", "기술추격"]
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
