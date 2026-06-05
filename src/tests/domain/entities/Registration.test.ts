import { describe, it, expect, beforeEach } from 'vitest';
import { Registration, RegistrationStatus, RegistrationPeriod } from "../../../domain/entities/Registration.js";
import { CheckInAlreadyDisabledException, CheckInAlreadyEnabledException, InvalidRegistrationPeriodException, RegistrationAlreadyClosedException, RegistrationAlreadyOpenException } from "../../../domain/exceptions/RegistrationExceptions.js";

describe("Registration Entity", () => {
    describe("Registration", () => {
        it("should create a default registration", () => {
            const reg = Registration.create();
            expect(reg.getHasCheckIn()).toBe(false);
            expect(reg.getStatus()).toBe(RegistrationStatus.CLOSED);
            expect(reg.getRegistrationPeriod().getStartsAt()).toBeNull();
        });

        it("should open and close registration", () => {
            let reg = Registration.create();
            reg = reg.open();
            expect(reg.getStatus()).toBe(RegistrationStatus.OPEN);
            expect(reg.isOpen()).toBe(true);
            
            reg = reg.close();
            expect(reg.getStatus()).toBe(RegistrationStatus.CLOSED);
            expect(reg.isClosed()).toBe(true);
        });

        it("should throw exception if opening an already open registration", () => {
            let reg = Registration.create().open();
            expect(() => reg.open()).toThrow(RegistrationAlreadyOpenException);
        });

        it("should throw exception if closing an already closed registration", () => {
            let reg = Registration.create();
            expect(() => reg.close()).toThrow(RegistrationAlreadyClosedException);
        });

        it("should enable and disable check in", () => {
            let reg = Registration.create();
            reg = reg.enableCheckIn();
            expect(reg.getHasCheckIn()).toBe(true);
            
            reg = reg.disableCheckIn();
            expect(reg.getHasCheckIn()).toBe(false);
        });

        it("should throw exception if enabling checkin when already enabled", () => {
            let reg = Registration.create().enableCheckIn();
            expect(() => reg.enableCheckIn()).toThrow(CheckInAlreadyEnabledException);
        });

        it("should throw exception if disabling checkin when already disabled", () => {
            let reg = Registration.create();
            expect(() => reg.disableCheckIn()).toThrow(CheckInAlreadyDisabledException);
        });

        it("should schedule a registration period", () => {
            let reg = Registration.create();
            const start = new Date("2024-01-01");
            const end = new Date("2024-01-31");
            reg = reg.schedule(start, end);
            expect(reg.getRegistrationPeriod().getStartsAt()).toBe(start);
            expect(reg.getRegistrationPeriod().getEndsAt()).toBe(end);
        });
    });

    describe("RegistrationPeriod", () => {
        it("should create a period and check if open/closed correctly", () => {
            const now = new Date();
            const start = new Date(now.getTime() - 10000);
            const end = new Date(now.getTime() + 10000);
            const period = new RegistrationPeriod(start, end);
            
            expect(period.isOpen()).toBe(true);
            expect(period.isClosed()).toBe(false);
        });

        it("should be closed if end date has passed", () => {
            const now = new Date();
            const start = new Date(now.getTime() - 20000);
            const end = new Date(now.getTime() - 10000);
            const period = new RegistrationPeriod(start, end);
            
            expect(period.isOpen()).toBe(false);
            expect(period.isClosed()).toBe(true);
        });

        it("should throw exception if end date is before start date", () => {
            const start = new Date("2024-01-31");
            const end = new Date("2024-01-01");
            expect(() => new RegistrationPeriod(start, end)).toThrow(InvalidRegistrationPeriodException);
        });
    });
});
