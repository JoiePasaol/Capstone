import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import SelectOption from "@/Components/SelectOption";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        firstname: "",
        lastname: "",
        department: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const options = [
        { value: "IT", label: "IT" },
        { value: "HR", label: "HR" },
    ];

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="first name" value="First Name" />

                    <TextInput
                        value={data.firstname}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData("firstname", e.target.value)}
                    />

                    <InputError message={errors.firstname} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        className="mt-4 mb-1"
                        htmlFor="last name"
                        value="Lastname"
                    />

                    <TextInput
                        value={data.lastname}
                        className="mt-1block w-full"
                        isFocused={true}
                        onChange={(e) => setData("lastname", e.target.value)}
                    />

                    <InputError message={errors.lastname} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="department" value="Department" />

                    <SelectOption
                        options={options}
                        value={data.department}
                        className="mt-1 block w-full"
                        onChange={(e) => setData("department", e.target.value)}
                    />

                    <InputError message={errors.department} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        type="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        onChange={(e) => setData("email", e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        type="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        onChange={(e) => setData("password", e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        type="password"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route("login")}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
