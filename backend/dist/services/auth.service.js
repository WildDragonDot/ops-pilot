import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.service.js';
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('CRITICAL: JWT_SECRET environment variable is required'); })();
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
    if (!user.password) {
        throw new Error('This account uses social sign-in (Google/GitHub). Please sign in using your provider.');
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
            provider: user.provider || 'email',
            avatarUrl: user.avatarUrl,
            organizationId: user.organizationId,
            organizationName: user.organization.name
        }
    };
}
export async function authenticateFirebaseUser(firebaseUid, email, name, provider, avatarUrl) {
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { firebaseUid },
                { email: email.toLowerCase() }
            ]
        },
        include: { organization: true }
    });
    let org = user ? user.organization : await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'OpsPilot Workspace',
                slug: `opspilot-${Date.now()}`
            }
        });
    }
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                firebaseUid,
                provider,
                avatarUrl,
                role: 'DEVELOPER',
                organizationId: org.id
            },
            include: { organization: true }
        });
    }
    else if (!user.firebaseUid || user.provider !== provider) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                firebaseUid,
                provider,
                avatarUrl: avatarUrl || user.avatarUrl,
                name: user.name || name
            },
            include: { organization: true }
        });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            provider: user.provider || provider,
            avatarUrl: user.avatarUrl,
            organizationId: user.organizationId,
            organizationName: org.name
        }
    };
}
export function verifyJwtToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
