import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserRoles, UserStatus } from "../../../domain/entities/User.js";
import { MissingRequiredUserFieldsException, UserAlreadyActiveException, UserAlreadyBlockedException, UserAlreadyDeletedException, UserDeletedException, UserNotActiveException, UserNotBlockedException, UserNotDeletedException, UserNotInactiveException } from "../../../domain/exceptions/UserExceptions.js";

describe("User Entity", () => {
    describe("Factory Methods", () => {
        it("should create user by admin", () => {
            const user = User.createByAdmin("test@test.com", "tempPass", "TestAlias", UserRoles.PLAYER);
            expect(user.getEmail()).toBe("test@test.com");
            expect(user.getAlias()).toBe("TestAlias");
            expect(user.getRole()).toBe(UserRoles.PLAYER);
            expect(user.getStatus()).toBe(UserStatus.INACTIVE);
            expect(user.getPassword()).toBe("tempPass");
            expect(user.getId()).toBeDefined();
            expect(user.getRegisteredAt()).toBeDefined();
            expect(user.getDeletedAt()).toBeNull();
        });

        it("should create self user", () => {
            const user = User.createSelf("self@test.com", "pass123", "SelfAlias");
            expect(user.getEmail()).toBe("self@test.com");
            expect(user.getStatus()).toBe(UserStatus.ACTIVE);
            expect(user.getId()).toBeDefined();
            expect(user.getRegisteredAt()).toBeDefined();
            expect(user.getDeletedAt()).toBeNull();
        });

        it("should throw MissingRequiredUserFieldsException for invalid data", () => {
            expect(() => User.createSelf("", "pass", "Alias")).toThrow(MissingRequiredUserFieldsException);
            expect(() => User.createSelf("email", "", "Alias")).toThrow(MissingRequiredUserFieldsException);
            expect(() => User.createSelf("email", "pass", "")).toThrow(MissingRequiredUserFieldsException);

            expect(() => User.createByAdmin("admin@test.com", "", "Alias", UserRoles.ADMIN)).toThrow(MissingRequiredUserFieldsException);
            expect(() => User.createByAdmin("", "temp", "Alias", UserRoles.ADMIN)).toThrow(MissingRequiredUserFieldsException);
            expect(() => User.createByAdmin("admin@test.com", "temp", "", UserRoles.ADMIN)).toThrow(MissingRequiredUserFieldsException);
            expect(() => User.createByAdmin("admin@test.com", "temp", "Alias", null as any)).toThrow(MissingRequiredUserFieldsException);
        });
    });

    describe("Update Methods", () => {
        let user: User;
        beforeEach(() => {
            user = User.createSelf("test@test.com", "pass123", "Alias");
        });

        it("should update email", () => {
            user.updateEmail("new@test.com");
            expect(user.getEmail()).toBe("new@test.com");
        });

        it("should throw exception when updating email with invalid value", () => {
            expect(() => user.updateEmail("")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.updateEmail("   ")).toThrow(MissingRequiredUserFieldsException);
        });

        it("should update password", () => {
            user.updatePassword("newPass");
            expect(user.getPassword()).toBe("newPass");
        });

        it("should throw exception when updating password with invalid value", () => {
            expect(() => user.updatePassword("")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.updatePassword("   ")).toThrow(MissingRequiredUserFieldsException);
        });

        it("should update alias", () => {
            user.updateAlias("NewAlias");
            expect(user.getAlias()).toBe("NewAlias");
        });

        it("should throw exception when updating alias with invalid value", () => {
            expect(() => user.updateAlias("")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.updateAlias("   ")).toThrow(MissingRequiredUserFieldsException);
        });
    });

    describe("Status Management", () => {
        let user: User;
        beforeEach(() => {
            user = User.createSelf("test@test.com", "pass123", "Alias");
        });

        it("should delete user and anonymize data", () => {
            user.delete();
            expect(user.getStatus()).toBe(UserStatus.DELETED);
            expect(user.getDeletedAt()).toBeInstanceOf(Date);
            expect(user.getEmail()).toContain("deleted_");
            expect(user.getPassword()).toBeUndefined();
        });

        it("should throw exception if deleting an already deleted user", () => {
            user.delete();
            expect(() => user.delete()).toThrow(UserAlreadyDeletedException);
        });

        it("should not allow updating data on deleted user", () => {
            user.delete();
            expect(() => user.updateEmail("a@a.com")).toThrow(UserDeletedException);
            expect(() => user.updatePassword("new")).toThrow(UserDeletedException);
            expect(() => user.updateAlias("New")).toThrow(UserDeletedException);
        });

        it("should restore a deleted user", () => {
            user.delete();
            user.restore("restored@test.com", "newPass");
            expect(user.getStatus()).toBe(UserStatus.INACTIVE);
            expect(user.getEmail()).toBe("restored@test.com");
            expect(user.getPassword()).toBe("newPass");
            expect(user.getDeletedAt()).toBeNull();
        });

        it("should throw exception when restoring a non-deleted user", () => {
            expect(() => user.restore("restored@test.com", "newPass")).toThrow(UserNotDeletedException);
        });

        it("should throw exception when restoring with invalid fields", () => {
            user.delete();
            expect(() => user.restore("", "newPass")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.restore("restored@test.com", "")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.restore("   ", "newPass")).toThrow(MissingRequiredUserFieldsException);
            expect(() => user.restore("restored@test.com", "   ")).toThrow(MissingRequiredUserFieldsException);
        });

        it("should block and unblock user", () => {
            user.block();
            expect(user.getStatus()).toBe(UserStatus.BLOCKED);
            user.unblock();
            expect(user.getStatus()).toBe(UserStatus.ACTIVE);
        });

        it("should throw exception when blocking an already blocked user", () => {
            user.block();
            expect(() => user.block()).toThrow(UserAlreadyBlockedException);
        });

        it("should throw exception when blocking a non-active user", () => {
            user.deactivate();
            expect(() => user.block()).toThrow(UserNotActiveException);
        });

        it("should throw exception when unblocking a non-blocked user", () => {
            expect(() => user.unblock()).toThrow(UserNotBlockedException);
        });

        it("should activate and deactivate user", () => {
            user.deactivate();
            expect(user.getStatus()).toBe(UserStatus.INACTIVE);
            user.activate();
            expect(user.getStatus()).toBe(UserStatus.ACTIVE);
        });

        it("should throw exception when activating an already active user", () => {
            expect(() => user.activate()).toThrow(UserAlreadyActiveException);
        });

        it("should throw exception when activating a non-inactive user", () => {
            user.block();
            expect(() => user.activate()).toThrow(UserNotInactiveException);
        });
    });

    describe("Rehydrate", () => {
        it("should rehydrate user", () => {
            const data = {
                id: "id123",
                email: "email@a.com",
                alias: "alias",
                role: UserRoles.ADMIN,
                registeredAt: new Date(),
                deletedAt: null,
                status: UserStatus.ACTIVE,
                password: "password123"
            };
            const user = User.rehydrate(data);
            expect(user.getId()).toBe("id123");
            expect(user.getEmail()).toBe("email@a.com");
            expect(user.getAlias()).toBe("alias");
            expect(user.getRole()).toBe(UserRoles.ADMIN);
            expect(user.getStatus()).toBe(UserStatus.ACTIVE);
            expect(user.getPassword()).toBe("password123");
            expect(user.getRegisteredAt()).toBeInstanceOf(Date);
            expect(user.getDeletedAt()).toBeNull();
        });
    });
});
