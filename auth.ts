import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

// 로컬 실행(SERVER_PHASE=local) 시에만 활성화. 백엔드 local profile 의 /dev/token 으로 토큰을 발급받는다.
export const LOCAL_DEV_PROVIDER_ID = "local-dev"
export const isLocalDevLoginEnabled = (process.env.SERVER_PHASE ?? "local") === "local"
const LOCAL_API_BASE_URL = "http://localhost:7070"

const localDevProvider = Credentials({
    id: LOCAL_DEV_PROVIDER_ID,
    name: "Local Dev",
    credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
    },
    async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim() || "local-user@localhost"
        const name = (credentials?.name as string | undefined)?.trim() || email.split("@")[0]

        const response = await fetch(`${LOCAL_API_BASE_URL}/dev/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject: email, email, name }),
        })
        if (!response.ok) {
            console.error(`/dev/token 호출 실패: ${response.status}. 백엔드를 local profile 로 실행했는지 확인하세요.`)
            return null
        }
        const body = await response.json() as { accessToken: string }
        return { id: email, email, name, accessToken: body.accessToken }
    },
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/login",
    },
    providers: [
        ...(isLocalDevLoginEnabled ? [localDevProvider] : []),
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
        async signIn({ account, profile }) {
            // 로컬 로그인은 도메인 체크 대상이 아님
            if (account?.provider === LOCAL_DEV_PROVIDER_ID) {
                return isLocalDevLoginEnabled
            }

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
        async jwt({ token, account, user }) {
            if (account?.provider === LOCAL_DEV_PROVIDER_ID) {
                token.id_token = (user as { accessToken?: string }).accessToken
            } else if (account) {
                token.id_token = account.id_token
            }
            return token
        },
        async session({ session, token }) {
            session.sessionToken = token.id_token as string
            return session
        },
    },
})
