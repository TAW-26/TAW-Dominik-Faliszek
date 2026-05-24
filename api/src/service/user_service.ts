import UserModel from "../schema/user_schema";
import authService from "./auth_service";

class UserService {

    public async registerUser(userData: any, role: string): Promise<void> {
        const existingUser = await UserModel.findOne({ login: userData.login });
        if (existingUser) throw new Error('User already exists');

        const hashedPassword = await authService.hashPassword(userData.password);

        const newUser = new UserModel({
            ...userData,
            password_hash: hashedPassword,
            role: role
        });
        await newUser.save();
    }

    public async loginUser(login: string, password: string): Promise<string> {
        const user = await UserModel.findOne({ login });
        if (!user) throw new Error('Invalid credentials');


        if (!user.password_hash) {
            throw new Error('This account uses Google Sign-In. Please log in with Google.');
        }

        const isValid = await authService.verifyPassword(user.password_hash, password);
        if (!isValid) throw new Error('Invalid credentials');

        return authService.generateToken(user._id.toString(), user.role, user.username);
    }

    public async loginWithGoogle(credential: string): Promise<string> {
        const payload = await authService.verifyGoogleToken(credential);
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token');
        }

        let user = await UserModel.findOne({ login: payload.email });

        if (!user) {
            user = await UserModel.create({
                login: payload.email,
                username: payload.name || 'Google User',
                role: 'user',
                googleId: payload.sub,
            });
        }

        return authService.generateToken(user._id.toString(), user.role, user.username);
    }

    public async getUserNames(): Promise<any> {
        return await UserModel.find().select('username _id');
    }

}

export default UserService;