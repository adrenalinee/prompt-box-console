import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/login",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // 구글 로그인 창에서 특정 도메인 계정을 우선적으로 보여주도록 유도 (선택 사항)
            authorization: {
                params: {
                    hd: "mystix.ai", // 예: 'google.com'
                },
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            // 메인 페이지("/")는 로그인 없이 접근 허용
            if (nextUrl.pathname === "/") {
                return true;
            }
            return !!auth?.user
        },
        async signIn({ user, account, profile }) {
            // 로그인 시도 시 이메일 도메인 체크
            const allowedDomain = "mystix.ai"; // 허용할 도메인

            // 구글 로그인의 경우 profile.email_verified가 true인지도 확인하면 더 안전합니다.
            if (profile?.email?.endsWith(`@${allowedDomain}`)) {
                return true; // 로그인 허용
            }

            // 조건에 맞지 않으면 로그인 거부 (에러 페이지로 이동)
            return false;
            // 또는 "/unauthorized" 같은 특정 경로로 리다이렉트 가능:
            // return "/unauthorized-page"
        },

        // 이전에 설정한 JWT 및 Session 콜백 유지...
        async jwt({ token, account }) {
            if (account) token.id_token = account.id_token
            return token
        },
        async session({ session, token }) {
            session.sessionToken = token.id_token as string
            return session
        },
    },
})
