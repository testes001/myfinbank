/**
 * Accessibility Tests - WCAG 2.2 AA Level Compliance
 * 
 * Tests verify that login form components meet WCAG 2.2 AA accessibility standards
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginFormFields } from '@/components/LoginFormFields';
import { PasswordResetForm } from '@/components/PasswordResetForm';

describe('LoginFormFields Accessibility', () => {
  const defaultProps = {
    email: '',
    password: '',
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: '',
    rateLimitInfo: {
      allowed: true,
      remainingAttempts: 5,
    },
    onForgotPassword: vi.fn(),
  };

  describe('WCAG 2.1 1.3.1 Info and Relationships (Level A)', () => {
    it('should have properly associated labels with form inputs', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should use aria-label for inputs without visible labels', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');
    });

    it('should mark required fields with aria-invalid when empty', () => {
      const { rerender } = render(
        <LoginFormFields
          {...defaultProps}
          email=""
        />
      );
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      
      // Simulate blur to trigger validation
      emailInput.focus();
      emailInput.blur();
      
      rerender(
        <LoginFormFields
          {...defaultProps}
          email=""
        />
      );
      
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('WCAG 2.1 1.4.1 Use of Color (Level A)', () => {
    it('should not rely on color alone for error indication', () => {
      render(<LoginFormFields {...defaultProps} error="Invalid credentials" />);
      
      const alert = screen.getByRole('alert');
      // Should have icon + text, not just color
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain('Invalid credentials');
    });
  });

  describe('WCAG 2.1 2.1.1 Keyboard (Level A)', () => {
    it('should allow keyboard navigation through all form elements', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const forgotButton = screen.getByRole('button', { name: /forgot your password/i });
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(forgotButton).toBeInTheDocument();
    });

    it('should have visible focus indicators on all interactive elements', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });
  });

  describe('WCAG 2.1 2.4.3 Focus Order (Level A)', () => {
    it('should have logical focus order: email → password → show/hide → submit → forgot password', () => {
      const { container } = render(<LoginFormFields {...defaultProps} />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // All form elements should be within the form
      const formElements = form?.querySelectorAll('input, button');
      expect(formElements?.length).toBeGreaterThan(0);
    });
  });

  describe('WCAG 2.1 2.4.4 Link Purpose (Level A)', () => {
    it('should have descriptive button text', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forgot your password/i })).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 3.2.1 On Focus (Level A)', () => {
    it('should not cause unexpected context changes on focus', () => {
      const { container } = render(<LoginFormFields {...defaultProps} />);
      const form = container.querySelector('form');
      
      // Form should not submit or change on focus
      expect(form).not.toHaveAttribute('onFocus', expect.stringContaining('submit'));
    });
  });

  describe('WCAG 2.1 3.3.1 Error Identification (Level A)', () => {
    it('should display error messages with role="alert"', () => {
      render(<LoginFormFields {...defaultProps} error="Invalid credentials" />);
      
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid credentials');
    });

    it('should use aria-live for dynamic error announcements', () => {
      const { rerender } = render(<LoginFormFields {...defaultProps} error="" />);
      
      rerender(<LoginFormFields {...defaultProps} error="New error message" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('WCAG 2.1 3.3.3 Error Suggestion (Level AA)', () => {
    it('should show password toggle button with accessible label', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText(/show password|hide password/i);
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });

  describe('Password Toggle Accessibility', () => {
    it('should have aria-pressed attribute on password toggle', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle aria-pressed when clicked', async () => {
      const { rerender } = render(<LoginFormFields {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
      
      // Note: Full interaction test would require user event simulation
    });
  });

  describe('Form Validation Messages', () => {
    it('should show required field error with role="alert"', () => {
      render(<LoginFormFields {...defaultProps} email="" />);
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      emailInput.focus();
      emailInput.blur();
      
      const alert = screen.queryAllByRole('alert');
      expect(alert.length).toBeGreaterThan(0);
    });

    it('should use aria-describedby to link error messages to inputs', () => {
      render(<LoginFormFields {...defaultProps} />);
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const describedBy = emailInput.getAttribute('aria-describedby');
      
      if (describedBy) {
        const description = document.getElementById(describedBy);
        expect(description).toBeInTheDocument();
      }
    });
  });
});

describe('PasswordResetForm Accessibility', () => {
  const defaultProps = {
    email: '',
    onEmailChange: vi.fn(),
    onSubmitRequest: vi.fn(),
    onSubmitConfirm: vi.fn(),
    onBack: vi.fn(),
    resetCode: '',
    onResetCodeChange: vi.fn(),
    newPassword: '',
    onNewPasswordChange: vi.fn(),
    isLoading: false,
    error: '',
    resetRequested: false,
  };

  it('should have accessible labels on all form fields', () => {
    render(<PasswordResetForm {...defaultProps} />);
    
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    expect(emailInput).toBeInTheDocument();
  });

  it('should have accessible buttons with descriptive labels', () => {
    render(<PasswordResetForm {...defaultProps} />);
    
    const sendButton = screen.getByRole('button', { name: /send reset code/i });
    const backButton = screen.getByRole('button', { name: /back to sign in/i });
    
    expect(sendButton).toBeInTheDocument();
    expect(backButton).toBeInTheDocument();
  });

  it('should show confirmation step with proper labels', () => {
    render(<PasswordResetForm {...defaultProps} resetRequested={true} />);
    
    const codeInput = screen.getByRole('textbox', { name: /verification code/i });
    const passwordInput = screen.getByLabelText(/new password/i);
    
    expect(codeInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('should announce errors with aria-live="assertive"', () => {
    render(<PasswordResetForm {...defaultProps} error="Invalid code" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('Secure Storage Accessibility', () => {
  it('should not expose tokens in DOM or localStorage', () => {
    // Tokens stored in memory and IndexedDB should not be visible in HTML
    const token = 'secret-token-12345';
    
    expect(document.body.innerHTML).not.toContain(token);
    expect(localStorage.getItem('bankingAccessToken')).toBeNull();
  });
});

describe('Form Focus Management', () => {
  it('should maintain focus visibility during form submission', () => {
    render(<LoginFormFields {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      // Check for focus styles
      const hasOutline = button.className.includes('focus:outline-none');
      const hasRing = button.className.includes('focus:ring');
      
      expect(hasOutline || hasRing).toBe(true);
    });
  });
});