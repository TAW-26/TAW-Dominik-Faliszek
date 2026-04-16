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

        const isValid = await authService.verifyPassword(user.password_hash, password);
        if (!isValid) throw new Error('Invalid credentials');

        return authService.generateToken(user._id.toString(), user.role);
    }
}

export default UserService;