// 프로젝트 루트(/proxy.ts)에 위치
export { auth as proxy } from "@/auth"

export const config = {
    // 인증이 필요 없는 정적 파일이나 로고 등을 제외한 모든 경로에 적용
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
