import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { redirect } from 'next/navigation'

// In a real app, this should be in an environment variable
// const secretKey = process.env.JWT_SECRET
const secretKey = 'cybersecurity-super-secret-key-for-saas'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
 return await new SignJWT(payload)
 .setProtectedHeader({ alg: 'HS256' })
 .setIssuedAt()
 .setExpirationTime('24h') // 24 hours session
 .sign(key)
}

export async function decrypt(input: string): Promise<any> {
 try {
 const { payload } = await jwtVerify(input, key, {
 algorithms: ['HS256'],
 })
 return payload
 } catch (error) {
 return null
 }
}

export async function getSession() {
 const cookieStore = await cookies()
 const session = cookieStore.get('saas_session')?.value
 
 if (!session) redirect('/login')

 const parsed = await decrypt(session)
 if (!parsed) redirect('/login')
 
 return {
 userId: parsed.userId as string,
 tenantId: parsed.tenantId as string,
 role: parsed.role as string,
 username: parsed.username as string,
 }
}
