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
//  PDF는 사이트 안에서 바로 읽기(팝업)와 다운로드가 모두 됩니다.
//
//  상세 페이지 (제목을 누르면 열리는 전체 화면 페이지, work.html?id=...)
//    id         : 영문 소문자·숫자·하이픈으로 된 고유 이름. 있으면 제목이 상세 페이지로 연결됩니다.
//    subheading / subheading_en : 국문/영문 부제
//    abstract / abstract_en     : 국문/영문 초록 (문단은 \n\n 으로 구분)
//    keywords / keywords_en     : 국문/영문 주제어
//  목차와 쪽수는 PDF에서 자동으로 읽어 옵니다.
//  쓰지 않는 항목은 "" 로 두거나 아예 지우면 화면에 안 나옵니다.
//  최신 연도가 위로 자동 정렬되고, 같은 해 안에서는 위에 적은 것이 먼저 나옵니다.
// =============================================================

window.SITE = {
  title: "uxixs",
  subtitle: "Works archive",

  works: [
    {
      id: "ai-distribution",
      type: "paper",
      title: "인공지능 시대 분배 제도의 순환 구조 분석",
      subheading: "기본소득의 수요 유지 효과, 국제적 잉여 이전과 추출의 역설, 기술 추격을 중심으로",
      subtitle: "A Circular-Flow Analysis of Distribution Institutions in the Age of AI",
      subheading_en: "Basic Income and Aggregate Demand, the Extraction Paradox in International Surplus Transfer, and Technological Catch-up",
      year: 2026,
      venue: "",
      description: "AI 기업 수익의 일부를 기본소득으로 돌려주는 분배 구조가 총수요를 유지할 수 있는지, 그리고 국가 간 잉여 이전이 세계 수요와 후진국의 자립에 어떤 영향을 미치는지를 묻는다. 국내 순환 모형, 두 나라 모형, 기술 추격 모형으로 조건부 명제를 도출하고, 저·중소득국의 국제수지 자료로 통합 모형을 점검하였다.",
      abstract: "본 논문은 인공지능(AI) 기업 수익의 일부를 기본소득으로 환원하는 분배 구조가 총수요를 유지할 수 있는지를 단순 순환 모형으로 탐색한다. 첫째, 국내 순환 모형에서 정상상태 수요는 Y* = X/(1 − m)이며, 분배 제도는 계층 간 지출 성향의 차이를 통해서만 수요에 영향을 미친다. 자본 소유자의 저축이 국내 투자로 충분히 환류하지 않는 조건에서는 이윤에 대한 국민 지분의 확대가 기본소득 환원율의 상향보다 수요 유지에 유리하다. 이 순위는 한국 통계를 참조한 대리 설정에서도 유지되나, 효과의 크기는 소비성향 격차에 민감하다. 둘째, 선진국이 순이전율을 선택하고 후진국의 대응이 제한된다는 가정 아래 두 나라 모형을 수치적으로 풀면, 선진국의 현재가치를 극대화하는 경로는 성장을 허용한 뒤 동결하는 형태이며, 연속시간·무한 시평에서 동결 수준은 닫힌 해 Ŷ = Yₘₐₓ(1 − ρv/e)로 주어진다. 이로부터 종속이론의 두 갈래(저발전의 발전, 종속적 발전)가 두 개의 임계 할인율로 갈린다. 후진국에 충분히 저렴한 외부 선택지가 있으면 동결은 불가능하다. 셋째, 두 모형을 결합하여 순이전이 세계 수요에 미치는 효과가 두 나라 이전 승수의 차로 결정됨을 보이고, 이를 AI 전환에 따른 국내 분배 구조와 후진국의 노동 대체 정도에 연결한다. 순이전이 후진국의 지출을 그대로 줄이는 기준 모형에서는 선진국의 누출률이 후진국 이상일 때 순이전율의 상승이 세계 수요를 감소시키고, 순이전 수입은 후진국의 외부 주입을 넘지 못한다. 생산성 이득이 체감하고 끝점 조건이 성립하면 유일한 임계 순이전율이 존재한다. 넷째, 기술 확산 모형에서 확산이 있으면 선진국의 자율 성장률이 후진국 이상일 때 상대 기술 수준이 일정한 비율로 수렴하고 후진국의 자율 성장률이 더 높으면 유한 시간 안에 추월이 일어나며, 초선형 자기개선이 지속되는 시나리오에서는 초기 격차가 추격을 어렵게 한다. 자립 임계점을 상대 기술 수준에 연결하면, 확산의 억제가 선진국에 주는 이득은 곧 포화되는 반면 후진국의 자립은 한없이 지연된다. 다섯째, 통합 모형을 저·중소득국의 국제수지 자료에 대응시킨 결과, 사전 등록한 세 개의 도구변수 검정은 모두 판별 불가였고, 실제 유출을 기준으로 한 보정에서 관측 가능한 매개변수는 역설 구간과 양립하였으나, 모형이 함의하는 이질성에 관한 사전 등록 검정은 예측과 반대 부호로 나타났다. 본 논문의 결과는 모두 명시된 가정 아래의 조건부 결과이고, 예시 매개변수에 기초한 수치는 추정치가 아니다.",
      abstract_en: "This exploratory paper uses simple circular-flow models to ask whether a distribution scheme that returns part of artificial intelligence (AI) firms' revenue as a basic income can sustain aggregate demand. First, in a domestic circular-flow model, steady-state demand is Y* = X/(1 − m), and distribution institutions affect demand only through differences in spending propensities across groups. When capital owners' savings are not sufficiently recycled into domestic investment, expanding a national equity stake in profits sustains demand better than raising the basic-income recycling rate. This ranking survives a proxy calibration based on Korean statistics, although its magnitude is sensitive to the gap in propensities to consume. Second, solving a two-country model numerically under the assumptions that the advanced economy chooses the net transfer rate and that the developing economy's response is limited, the path that maximizes the advanced economy's present value is to allow growth and then freeze it; in continuous time with an infinite horizon the freeze level has the closed form Ŷ = Yₘₐₓ(1 − ρv/e). The two strands of dependency theory (the development of underdevelopment and dependent development) are thereby separated by two critical discount rates. If the developing economy has a sufficiently cheap outside option, freezing is infeasible. Third, combining the two models, we show that the effect of a net transfer on world demand is determined by the difference between the two countries' transfer multipliers, and we link this to the domestic distribution structure under the AI transition and to the degree of labor displacement in the developing economy. In the baseline in which the transfer reduces the developing economy's spending one-for-one, a higher net transfer rate lowers world demand when the advanced economy's leakage rate is at least that of the developing economy, and net transfer revenue cannot exceed the developing economy's external injections. With diminishing productivity gains and an endpoint condition, a unique threshold net transfer rate exists. Fourth, in a technology diffusion model, relative technology converges to a constant ratio when the advanced economy's autonomous growth rate is at least that of the developing economy, overtaking occurs in finite time when the latter is higher, and under sustained superlinear self-improvement the initial gap hinders catch-up. When the self-reliance threshold is tied to the relative technology level, the advanced economy's gain from suppressing diffusion saturates quickly while the developing economy's self-reliance is delayed without bound. Fifth, taking the combined model to balance-of-payments data for low- and middle-income countries, three instrumental-variable tests specified in advance were all inconclusive; a recalibration based on actual outflows found the observable parameters compatible with the paradox region; but a heterogeneity test specified in advance produced the opposite sign to the model's prediction. All results are conditional on stated assumptions, and figures based on illustrative parameters are not estimates.",
      keywords: ["인공지능", "기본소득", "유효수요", "국부펀드", "보편적 기본자본", "종속이론", "기술 추격"],
      keywords_en: ["artificial intelligence", "basic income", "effective demand", "sovereign wealth fund", "universal basic capital", "dependency theory", "technological catch-up"],
      tags: ["AI 분배", "기본소득", "순환 모형", "국제 이전", "기술 추격"],
      files: [
        { label: "한국어", path: "papers/ai-distribution-ko.pdf" },
        { label: "English", path: "papers/ai-distribution-en.pdf" }
      ],
      link: "",
      code: "",
      image: ""
    }
  ]
};
