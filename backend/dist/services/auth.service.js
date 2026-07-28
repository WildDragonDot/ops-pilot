import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.service.js';
const JWT_SECRET = process.env.JWT_SECRET || 'opspilot-secret-jwt-key-2026';
export async function registerUser(email, password, name, orgName) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }
    let org = await prisma.organization.findFirst();
    if (!org || orgName) {
        const slug = (orgName || 'my-company').toLowerCase().replace(/[^a-z0-9]/g, '-');
        org = await prisma.organization.create({
            data: {
                name: orgName || 'My Organization',
                slug: `${slug}-${Date.now()}`
            }
        });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: 'DEVELOPER',
            organizationId: org.id
        }
    });
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: org.name
        }
    };
}
export async function loginUser(email, password) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
    });
    if (!user) {
        throw new Error('Invalid email or password.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password.');
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name
        }
    };
}
export function verifyJwtToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
