import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const checkUser = async () => {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const token = await getToken({ template: "convex" });
    const user = await fetchMutation(
      api.users.checkUser,
      {},
      { token }
    );

    if (user) {
      user.id = user._id; // Ensure compatibility with existing components
    }

    return user;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
