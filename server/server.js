import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN
        : ['http://localhost:3000', process.env.CORS_ORIGIN],
    credentials: true,
}));

const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({error: 'Access denied'});

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({error: 'Invalid token'});
        req.user = user;
        next();
    });
};

// User Schema
const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    isAdmin: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    lastLogin: {type: Date}
});

// Post Schema – store media as Buffer
const postSchema = new mongoose.Schema({
    description: {type: String, default: ''},
    media: [{
        filename: {type: String, required: true},
        data: {type: Buffer, required: true},
        type: {type: String, required: true},
        size: {type: Number}
    }],
    uploaderEmail: {type: String, required: true},
    likes: [{type: String}],
    comments: [{
        userEmail: String,
        text: String,
        createdAt: {type: Date, default: Date.now}
    }],
    shares: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

const folderSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, default: ''},
    creatorEmail: {type: String, required: true},
    allowedUsers: [{type: String}], // Array of user emails with access
    color: {type: String, default: '#6366f1'}, // Color for UI
    isPrivate: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

postSchema.add({
    folderId: {type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null}
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Folder = mongoose.model('Folder', folderSchema);


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {fileSize: 50 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'));
        }
    }
});

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    try {
        const {email, password} = req.body;

        const existingUser = await User.findOne({email});
        if (existingUser) return res.status(400).json({error: 'User already exists'});

        const hashedPassword = await bcrypt.hash(password, 10);

        const userCount = await User.countDocuments();
        const isAdmin = userCount === 0;

        const newUser = new User({email, password: hashedPassword, isAdmin});
        await newUser.save();

        const token = jwt.sign({
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            userId: newUser._id
        }, JWT_SECRET, {expiresIn: '7d'});

        res.status(201).json({
            message: 'Account created successfully',
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({error: 'Registration failed'});
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) return res.status(401).json({error: 'Invalid credentials'});

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({error: 'Invalid credentials'});

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({
            email: user.email,
            isAdmin: user.isAdmin,
            userId: user._id
        }, JWT_SECRET, {expiresIn: '7d'});
        res.status(200).json({message: 'Login successful', email: user.email, isAdmin: user.isAdmin, token});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
});

// --- POST ROUTES ---

app.post('/api/folders', authenticateToken, async (req, res) => {
    try {
        const {name, description, color, isPrivate, allowedUsers} = req.body;

        // Ensure allowedUsers is an array
        const users = Array.isArray(allowedUsers) ? allowedUsers : [];

        const newFolder = new Folder({
            name,
            description,
            color,
            isPrivate: isPrivate || false,
            creatorEmail: req.user.email,
            allowedUsers: [...users, req.user.email] // Creator always has access
        });

        await newFolder.save();
        res.status(201).json({message: 'Folder created successfully', folder: newFolder});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to create folder'});
    }
});

app.get('/api/folders', authenticateToken, async (req, res) => {
    try {
        const folders = await Folder.find({
            $or: [
                {creatorEmail: req.user.email},
                {allowedUsers: req.user.email},
                {isPrivate: false} // Include public folders
            ]
        }).sort({updatedAt: -1});

        res.status(200).json(folders);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch folders'});
    }
});
app.get('/api/folders/all', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({error: 'Admin access required'});

        const folders = await Folder.find().sort({updatedAt: -1});
        res.status(200).json(folders);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch all folders'});
    }
});

app.get('/api/folders/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({error: 'Folder not found'});

        // Check if user has access
        if (!req.user.isAdmin &&
            folder.creatorEmail !== req.user.email &&
            !folder.allowedUsers.includes(req.user.email)) {
            return res.status(403).json({error: 'Access denied'});
        }

        // Get posts in this folder
        const posts = await Post.find({folderId: folder._id})
            .sort({createdAt: -1})
            .lean();

        const postsMeta = posts.map(post => ({
            ...post,
            media: post.media.map(m => ({
                filename: m.filename,
                type: m.type,
                size: m.size
            }))
        }));

        res.status(200).json({folder, posts: postsMeta});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch folder'});
    }
});

app.put('/api/folders/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({error: 'Folder not found'});

        // Check if user is creator or admin
        if (!req.user.isAdmin && folder.creatorEmail !== req.user.email) {
            return res.status(403).json({error: 'Only folder creator can modify'});
        }

        const {name, description, color, isPrivate, allowedUsers} = req.body;

        if (name) folder.name = name;
        if (description !== undefined) folder.description = description;
        if (color) folder.color = color;
        if (isPrivate !== undefined) folder.isPrivate = isPrivate;

        if (Array.isArray(allowedUsers)) {
            // Ensure creator always has access
            if (!allowedUsers.includes(folder.creatorEmail)) {
                allowedUsers.push(folder.creatorEmail);
            }
            folder.allowedUsers = allowedUsers;
        }

        folder.updatedAt = new Date();
        await folder.save();

        res.status(200).json({message: 'Folder updated successfully', folder});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to update folder'});
    }
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({error: 'Folder not found'});

        // Check if user is creator or admin
        if (!req.user.isAdmin && folder.creatorEmail !== req.user.email) {
            return res.status(403).json({error: 'Only folder creator can delete'});
        }

        // Remove folder reference from posts
        await Post.updateMany(
            {folderId: folder._id},
            {$set: {folderId: null}}
        );

        await Folder.findByIdAndDelete(req.params.id);
        res.status(200).json({message: 'Folder deleted successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to delete folder'});
    }
});

// Create Post (Admin only)
app.post('/api/posts', authenticateToken, upload.array('media', 10), async (req, res) => {
    try {
        const {description, uploaderEmail, folderId} = req.body;
        const files = req.files;
        if (!files || files.length === 0) return res.status(400).json({error: 'No files uploaded'});

        // If folderId is provided, verify user has access
        if (folderId && folderId !== 'null') {
            const folder = await Folder.findById(folderId);
            if (folder && !req.user.isAdmin &&
                folder.creatorEmail !== req.user.email &&
                !folder.allowedUsers.includes(req.user.email)) {
                return res.status(403).json({error: 'No access to this folder'});
            }
        }

        const media = files.map(file => ({
            filename: file.originalname,
            data: file.buffer,
            type: file.mimetype,
            size: file.size
        }));

        const newPost = new Post({
            description,
            media,
            uploaderEmail: uploaderEmail || req.user.email,
            folderId: folderId || null,
            likes: [],
            comments: [],
            shares: 0
        });

        await newPost.save();
        res.status(201).json({message: 'Post created successfully', post: newPost});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to create post'});
    }
});

// Get Posts (with pagination)
app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const folderId = req.query.folderId;

        let query = {};

        if (folderId && folderId !== 'all') {
            // If specific folder, verify access
            const folder = await Folder.findById(folderId);
            if (!folder) return res.status(404).json({error: 'Folder not found'});

            if (!req.user.isAdmin &&
                folder.creatorEmail !== req.user.email &&
                !folder.allowedUsers.includes(req.user.email)) {
                return res.status(403).json({error: 'No access to this folder'});
            }

            query.folderId = folderId;
        } else if (folderId !== 'all') {
            // If no specific folder, get posts from accessible folders + public posts
            const accessibleFolders = await Folder.find({
                $or: [
                    {creatorEmail: req.user.email},
                    {allowedUsers: req.user.email},
                    {isPrivate: false}
                ]
            }).select('_id');

            const folderIds = accessibleFolders.map(f => f._id);

            query.$or = [
                {folderId: {$in: folderIds}},
                {folderId: null} // Public posts
            ];
        }

        const posts = await Post.find(query)
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Post.countDocuments(query);
        const hasMore = skip + posts.length < total;

        const postsMeta = posts.map(post => ({
            ...post,
            media: post.media.map(m => ({
                filename: m.filename,
                type: m.type,
                size: m.size
            }))
        }));

        res.status(200).json({posts: postsMeta, page, limit, total, hasMore});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch posts'});
    }
});
// Like / Unlike Post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({error: 'Post not found'});

        const idx = post.likes.indexOf(req.user.email);
        if (idx > -1) post.likes.splice(idx, 1);
        else post.likes.push(req.user.email);

        await post.save();
        res.status(200).json({
            message: idx > -1 ? 'Post unliked' : 'Post liked',
            likes: post.likes,
            totalLikes: post.likes.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to update like'});
    }
});

app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
    try {
        const {text} = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({error: 'Post not found'});

        // Create new comment object
        const newComment = {
            userEmail: req.user.email,
            text: text,
            createdAt: new Date()
        };

        // Add to comments array
        post.comments.push(newComment);
        await post.save();

        // Return the updated post with all comments
        res.status(200).json({
            success: true,
            message: 'Comment added successfully',
            comments: post.comments
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to create comment'});
    }
});

// Delete Post (Admin or owner)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({error: 'Post not found'});

        if (!req.user.isAdmin && req.user.email !== post.uploaderEmail)
            return res.status(403).json({error: 'Not authorized'});

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({message: 'Post deleted successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to delete post'});
    }
});

// Serve media from DB
app.get('/api/posts/:postId/media/:filename', authenticateToken, async (req, res) => {
    try {
        const {postId, filename} = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({error: 'Post not found'});

        const mediaItem = post.media.find(m => m.filename === filename);
        if (!mediaItem) return res.status(404).json({error: 'Media not found'});

        res.set('Content-Type', mediaItem.type);
        res.send(mediaItem.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch media'});
    }
});

// --- USER ROUTES (Admin only for some) ---

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({error: 'Admin access required'});

        const users = await User.find({}, {password: 0});
        const usersWithStats = await Promise.all(users.map(async user => ({
            ...user.toObject(),
            postCount: await Post.countDocuments({uploaderEmail: user.email}),
            lastLogin: user.lastLogin || user.createdAt
        })));

        res.status(200).json(usersWithStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
});

app.put('/api/users/:id/role', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({error: 'Admin access required'});

        const {id} = req.params;
        const {isAdmin} = req.body;

        if (!isAdmin) {
            const adminCount = await User.countDocuments({isAdmin: true});
            if (adminCount <= 1) return res.status(400).json({error: 'Cannot remove the last admin'});
        }

        const updatedUser = await User.findByIdAndUpdate(id, {isAdmin}, {new: true, select: '-password'});
        if (!updatedUser) return res.status(404).json({error: 'User not found'});

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to update user'});
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({error: 'Admin access required'});

        const {id} = req.params;
        const userToDelete = await User.findById(id);
        if (!userToDelete) return res.status(404).json({error: 'User not found'});

        if (userToDelete.isAdmin) {
            const adminCount = await User.countDocuments({isAdmin: true});
            if (adminCount <= 1) return res.status(400).json({error: 'Cannot delete the last admin'});
        }

        await Post.deleteMany({uploaderEmail: userToDelete.email});
        await User.findByIdAndDelete(id);

        res.status(200).json({message: 'User deleted successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to delete user'});
    }
});

// --- STATS ---
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({error: 'Admin access required'});

        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({isAdmin: true});
        const totalPosts = await Post.countDocuments();
        const totalImages = await Post.aggregate([
            {$unwind: '$media'},
            {$match: {'media.type': {$regex: /^image\//}}},
            {$count: 'count'}
        ]);
        const totalVideos = await Post.aggregate([
            {$unwind: '$media'},
            {$match: {'media.type': {$regex: /^video\//}}},
            {$count: 'count'}
        ]);

        const totalLikesAgg = await Post.aggregate([{$group: {_id: null, total: {$sum: {$size: '$likes'}}}}]);

        res.status(200).json({
            totalUsers,
            totalAdmins,
            totalPosts,
            totalImages: totalImages[0]?.count || 0,
            totalVideos: totalVideos[0]?.count || 0,
            totalLikes: totalLikesAgg[0]?.total || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch statistics'});
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
