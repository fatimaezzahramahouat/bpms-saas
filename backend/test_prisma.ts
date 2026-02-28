import prisma from "./src/lib/prisma";

async function test() {
    // This should not have a red squiggle if types are correct
    const user = await prisma.user.update({
        where: { id: "test" },
        data: {
            resetToken: "test",
            resetExpires: new Date()
        }
    });
}
