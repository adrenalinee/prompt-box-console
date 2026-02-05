import React from "react";
import { Center } from "@mantine/core";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginCard from "./LoginCard";

export default async function LoginPage() {
    const session = await auth();
    if (session?.user) {
        redirect("/");
    }

    return (
        <Center h="100vh" p="md">
            <LoginCard />
        </Center>
    );
}
