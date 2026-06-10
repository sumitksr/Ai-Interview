import React from "react";

export default function Login() {
    async function handleSubmit(formData) {
        "use server";

        const email = formData.get("email");
        const password = formData.get("password");

        console.log(email, password);

    }

    return (
        <div>
            <h1>Login</h1>
            <p>Please enter your credentials to log in.</p>

            <form action={handleSubmit}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                />
                <br />

                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                />
                <br />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}