import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import * as api from '../lib/api';
import type { Session } from '../lib/session';
import { Sheet } from './Sheet';
import { useToast } from './Toast';

export type AuthMode = 'login' | 'register';

export function AuthSheet({
  open,
  mode,
  onModeChange,
  onClose,
  onAuthed,
}: {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onAuthed: (session: Session) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState({ google: false, facebook: false });
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [lastOpen, setLastOpen] = useState(open);
  const [lastMode, setLastMode] = useState(mode);

  // Đổi mode hoặc mở lại: xoá lỗi và mật khẩu cũ.
  if (open !== lastOpen || mode !== lastMode) {
    setLastOpen(open);
    setLastMode(mode);
    if (open) {
      setPassword('');
    }
  }

  useEffect(() => {
    if (!open) return;
    const oauthError = window.sessionStorage.getItem('studysync.oauth.error');
    if (!oauthError) return;
    window.sessionStorage.removeItem('studysync.oauth.error');
    toast(oauthError, 'bad');
  }, [open, toast]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void api.getOAuthProviders().then((result) => {
      if (active) setProviders(result);
    }).catch(() => {
      if (active) setProviders({ google: false, facebook: false });
    }).finally(() => { if (active) setProvidersLoaded(true); });
    return () => { active = false; };
  }, [open]);

  const startOAuth = (provider: 'google' | 'facebook') => {
    window.location.assign(`${api.API_BASE_URL}/oauth_start.php?provider=${provider}`);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast('Nhập một địa chỉ email hợp lệ.', 'bad');
      return;
    }
    if (password.length < 8) {
      toast('Mật khẩu cần ít nhất 8 ký tự.', 'bad');
      return;
    }
    if (mode === 'register' && cleanName.length < 2) {
      toast('Nhập tên bạn muốn mọi người gọi.', 'bad');
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === 'login'
          ? await api.login(cleanEmail, password)
          : await api.register(cleanName, cleanEmail, password);
      onAuthed({ token: result.token, user: result.user });
      onClose();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không thể kết nối máy chủ.', 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
      subtitle={
        mode === 'login'
          ? 'Tiếp tục vào không gian học tập của nhóm.'
          : 'Bắt đầu một không gian cho nhóm của bạn. Chỉ mất một phút.'
      }
      footer={<>Máy chủ dữ liệu: {api.API_BASE_URL}</>}
    >
      <form className="sheet-body" onSubmit={submit} noValidate>
        {mode === 'register' ? (
          <div>
            <label className="field-label" htmlFor="auth-name">
              Tên hiển thị
            </label>
            <input
              id="auth-name"
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Minh Anh"
              autoComplete="name"
              data-autofocus
              maxLength={100}
            />
          </div>
        ) : null}

        <div>
          <label className="field-label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@truong.edu.vn"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            data-autofocus={mode === 'login' ? true : undefined}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="auth-password">
            Mật khẩu
          </label>
          <input
            id="auth-password"
            className="field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ít nhất 8 ký tự"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
          />
          {mode === 'register' ? <p className="field-hint">Từ 8 đến 72 ký tự.</p> : null}
        </div>

        <button type="submit" className="btn" disabled={busy} style={{ width: '100%', marginTop: 4 }}>
          {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>

        <div className="auth-provider-separator"><span>hoặc tiếp tục với</span></div>
        <div className="auth-provider-row">
          <button type="button" className="auth-provider" onClick={() => startOAuth('google')} disabled={!providers.google || !providersLoaded}>
            <span className="google-mark" aria-hidden="true">G</span> Google
          </button>
          <button type="button" className="auth-provider" onClick={() => startOAuth('facebook')} disabled={!providers.facebook || !providersLoaded}>
            <span className="facebook-mark" aria-hidden="true">f</span> Facebook
          </button>
        </div>
        {providersLoaded && !providers.google && !providers.facebook ? <p className="oauth-note">Đăng nhập mạng xã hội sẽ bật sau khi thêm Client ID/Secret vào backend/.env.</p> : null}

        <div className="sheet-alt">
          <span>{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
          <button
            type="button"
            className="linkish"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Tạo tài khoản mới' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
