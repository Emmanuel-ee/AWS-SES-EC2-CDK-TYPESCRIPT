import { Request, Response } from "express";
import { users, donate } from "../src/controllers/donationController";
import User from "../src/models/User";

describe("donate API", () => {
  beforeEach(() => {
    users.length = 0;
  });

  it("should handle valid donation", async () => {
    const userData = new User("ememeemmanuel3@gmail.com", "Emmanuel");
    const req = {
      body: {
        email: userData.email,
        donations: 100,
        name: userData.name,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await donate(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Donation received." });
    expect(users.length).toBe(1);
    expect(users[0]).toMatchObject({
      email: "ememeemmanuel3@gmail.com",
      name: "Emmanuel",
      donations: [100],
    });
    expect(users[0].donations).toEqual([100]);

    // Create another user
    const newUser = new User("newuser@example.com", "New User");
    const reqNewUser = {
      body: {
        email: newUser.email,
        donations: 50,
        name: newUser.name,
      },
    } as Request;
    const resNewUser = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await donate(reqNewUser, resNewUser);

    // Verify that the users array has 2 users
    expect(users.length).toBe(2);

    //'should handle valid donation from existing user'
    await donate(req, res);
    expect(users.length).toBe(2);
    expect(users[0].donations).toEqual([100, 100]);

    //create the third User
    const thirdUser = new User("newuser3@example.com", "New User");
    const reqNewUser3 = {
      body: {
        email: thirdUser.email,
        donations: 500,
        name: thirdUser.name,
      },
    } as Request;
    const resNewUser3 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await donate(reqNewUser3, resNewUser3);

    // Verify that the users array has 2 users
    expect(users.length).toBe(3);
    console.log(users);
  });

  it("should handle missing required fields", async () => {
    const incompleteUserData = new User("ghandi@gmail.com", "Ghandi");
    const req = {
      body: {
        email: incompleteUserData.email,
        donations: null,
        name: incompleteUserData.name,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await donate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing required fields.",
    });
    expect(users.length).toBe(0);
  });
});
