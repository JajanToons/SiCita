"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";

// Skema validasi Zod untuk form reset password
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
    confirmPassword: z
      .string()
      .min(6, "Konfirmasi password minimal 6 karakter."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru dan konfirmasi password tidak cocok.",
    path: ["confirmPassword"], // Tampilkan error di field konfirmasi password
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter(); // Menggunakan alias jika nama 'toast' bentrok

  const token = params?.token as string | undefined; // Ambil token dari URL

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null); // Untuk error umum halaman
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setPageError(
        "Token reset password tidak ditemukan di URL. Link mungkin tidak valid."
      );
      // Anda bisa redirect ke halaman lain jika token tidak ada
      // router.push('/forgot-password');
    }
  }, [token, router]);

  const onSubmit = async (formData: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Error", { description: "Token reset tidak tersedia." });
      return;
    }
    if (!backendUrl) {
      toast.error("Error Konfigurasi", {
        description: "URL Backend tidak diatur.",
      });
      return;
    }

    setIsLoading(true);
    setPageError(null); // Bersihkan error halaman sebelumnya

    try {
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Error dari backend (misal, token tidak valid, password terlalu lemah jika ada validasi backend)
        throw new Error(
          data.message || `Gagal mereset password: Status ${response.status}`
        );
      }

      // Sukses
      toast.success("Password Berhasil Direset!", {
        description:
          data.message || "Password Anda telah berhasil diubah. Silakan login.",
      });
      setResetSuccess(true); // Tandai sukses untuk mengubah UI
      form.reset(); // Kosongkan form

      // Anda bisa otomatis redirect ke login setelah beberapa saat
      // setTimeout(() => {
      //   router.push('/login');
      // }, 3000);
    } catch (err) {
      console.error("Password reset submit error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tidak diketahui.";
      setPageError(errorMessage); // Tampilkan error di level halaman
      toast.error("Reset Password Gagal", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageError && !token) {
    // Jika token tidak ada dari awal
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{pageError}</p>
          </CardContent>
          <CardFooter>
            <Link href="/forgot-password" passHref>
              <Button variant="outline">Minta Reset Password Baru</Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Reset Password Anda
          </CardTitle>
          {!resetSuccess && (
            <CardDescription>
              Masukkan password baru Anda di bawah ini. Pastikan password baru
              aman dan mudah Anda ingat.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 dark:text-green-400">
                Password Anda telah berhasil direset!
              </p>
              <Link href="/login" passHref>
                <Button className="w-full">Ke Halaman Login</Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {pageError && ( // Tampilkan error halaman (misal dari backend setelah submit)
                  <p className="text-sm text-center text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded-md">
                    {pageError}
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password Baru</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />{" "}
                      {/* Error dari Zod refine akan muncul di sini */}
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!resetSuccess && (
          <CardFooter className="flex flex-col items-center text-sm">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Kembali ke Login
            </Link>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
