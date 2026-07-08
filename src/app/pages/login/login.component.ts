import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/common/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  rememberMe = true;
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  onLogin(): void {
    if (this.username && this.password) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.username, this.password).subscribe({
        next: () => {
          this.loading = false;
          if (this.rememberMe) {
            localStorage.setItem('isAuthenticated', 'true');
            sessionStorage.removeItem('isAuthenticated');
          } else {
            sessionStorage.setItem('isAuthenticated', 'true');
            localStorage.removeItem('isAuthenticated');
          }
          this.router.navigate(['/torre-controle']);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMessage = 'Usuário ou senha incorretos.';
          } else {
            this.errorMessage = err.error?.message || 'Erro ao conectar ao servidor. Tente novamente.';
          }
        }
      });
    }
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked');
  }

  onRegister(): void {
    console.log('Register clicked');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    const token = this.authService.getToken();
    const isAuthenticated = (localStorage.getItem('isAuthenticated') === 'true'
      || sessionStorage.getItem('isAuthenticated') === 'true') && !!token;

    if (isAuthenticated || (this.authService.isAuthenticated() && token)) {
      this.router.navigate(['/torre-controle']);
    }
  }
}