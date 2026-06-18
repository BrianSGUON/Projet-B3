import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      company?: string
      plan?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    company?: string
    plan?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    company?: string
    plan?: string
  }
}
