import { registerUser, loginUser } from '../services/auth.service.js';
import { prisma } from '../services/db.service.js';
export async function register(req, res) {
    try {
        const { email, password, name, organizationName } = req.body;
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Full name is required.' });
        }
        const result = await registerUser(email.trim().toLowerCase(), password, name.trim(), organizationName?.trim());
        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            ...result
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Registration failed.' });
    }
}
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const result = await loginUser(email.trim().toLowerCase(), password);
        res.json({
            success: true,
            message: 'Logged in successfully.',
            ...result
        });
    }
    catch (err) {
        res.status(401).json({ error: err.message || 'Authentication failed.' });
    }
}
export async function getMe(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { organization: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
    }
}
