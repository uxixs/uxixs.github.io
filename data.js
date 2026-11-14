// =============================================================
//  이 파일만 고치면 사이트 내용이 바뀝니다.
//  논문 추가:   papers 배열에 { ... } 한 덩어리 추가 + PDF를 papers/ 폴더에 넣기
//  작업물 추가: projects 배열에 { ... } 한 덩어리 추가 + 썸네일을 images/ 폴더에 넣기
//  쓰지 않는 항목(link, code 등)은 지우거나 "" 로 두면 버튼이 안 보입니다.
// =============================================================

window.SITE = {
  name: "홍길동",
  role: "Undergraduate Researcher · Physics & Computer Science",
  bio: "물리와 계산을 좋아하는 학생입니다. 연구 논문과 직접 만든 프로젝트를 이곳에 모아 둡니다.",
  photo: "",                       // 예: "images/me.jpg" (비우면 이니셜 표시)
  links: {
    email: "you@example.com",
    github: "https://github.com/your-id",
    scholar: "",                   // Google Scholar 주소
    cv: ""                         // 예: "papers/cv.pdf"
  },

  papers: [
    {
      title: "예시 논문 제목: 무엇을 연구했는지 한 줄로",
      authors: "홍길동, 김철수",
      venue: "학부 연구 프로그램 결과보고서",
      year: 2026,
      abstract: "논문 요약을 두세 문장으로 적습니다. 'Abstract'를 누르면 펼쳐집니다.",
      pdf: "papers/example.pdf",   // papers/ 폴더에 넣은 PDF 파일 이름
      link: "",                    // arXiv, 학회 페이지 등 외부 링크
      code: "",                    // 관련 코드 저장소
      tags: ["Physics", "Simulation"]
    }
  ],

  projects: [
    {
      title: "예시 프로젝트",
      description: "무엇을 만들었고 어떤 문제를 풀었는지 짧게 적습니다.",
      image: "",                   // 예: "images/project1.png" (비우면 기본 색 블록)
      year: 2026,
      demo: "",                    // 실행해 볼 수 있는 주소
      code: "https://github.com/your-id/project",
      tags: ["Python", "Web"]
    }
  ]
};
