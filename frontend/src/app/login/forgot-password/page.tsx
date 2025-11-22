'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import api from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type OTPForm = z.infer<typeof otpSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  const onEmailSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      // TODO: Implement OTP sending API endpoint
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep('otp');
      toast({
        title: 'Success',
        description: 'OTP sent to your email',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onOTPSubmit = async (data: OTPForm) => {
    try {
      setLoading(true);
      // TODO: Implement OTP verification and password reset API endpoint
      await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Enter your email to receive an OTP'
              : 'Enter the OTP sent to your email and set a new password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerEmail('email')}
                  placeholder="Enter your email"
                />
                {emailErrors.email && (
                  <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit(onOTPSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  {...registerOTP('otp')}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
                {otpErrors.otp && (
                  <p className="text-sm text-destructive">{otpErrors.otp.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerOTP('newPassword')}
                  placeholder="Enter new password"
                />
                {otpErrors.newPassword && (
                  <p className="text-sm text-destructive">{otpErrors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerOTP('confirmPassword')}
                  placeholder="Confirm new password"
                />
                {otpErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{otpErrors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

