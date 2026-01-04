import "express-session";

// 이미 설치된 express-session 라이브러리의 정의를 수정
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// 세션에 userId를 넣을 거라고 TS에게 알려줌
// 이렇게 타입 확장(Declaration Merging)을 하지 않으면 
// 아무 데이터나 세션에 넣으려고 할 때 TypeScript가 엄격하기 때문에
// userId에 대해 모른다고 하며 에러를 띄움