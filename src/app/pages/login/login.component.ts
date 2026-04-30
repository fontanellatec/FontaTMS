import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  rememberMe = true;
  showPassword = false;

  constructor(private router: Router) {}

  onLogin(): void {
    if (this.username && this.password) {
      if (this.rememberMe) {
        localStorage.setItem('isAuthenticated', 'true');
        sessionStorage.removeItem('isAuthenticated');
      } else {
        sessionStorage.setItem('isAuthenticated', 'true');
        localStorage.removeItem('isAuthenticated');
      }
      this.router.navigate(['/torre-controle']);
    }
  }

  onForgotPassword(): void {
    // Handle forgot password logic
    console.log('Forgot password clicked');
  }

  onRegister(): void {
    // Handle register navigation/logic
    console.log('Register clicked');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      || sessionStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      this.router.navigate(['/torre-controle']);
    }
  }
}