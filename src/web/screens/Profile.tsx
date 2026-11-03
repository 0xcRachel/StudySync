import { useState } from 'react';
import type { FormEvent } from 'react';
import * as api from '../lib/api';
import type { User } from '../lib/api';
import { formatJoined } from '../lib/format';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/ui';

export function Profile({
  user,
  token,
  onUserChange,
  onLogout,
}: {
  user: User;
  token: string;
  onUserChange: (user: User) => void;
  onLogout: () => void;
}) {
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const dirty =
    name.trim() !== user.name || username.trim().toLowerCase() !== (user.username ?? '') || avatarUrl.trim() !== (user.avatar_url ?? '') || bio.trim() !== (user.bio ?? '').trim();

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const cleanName = name.trim();
    if (cleanName.length === 0) {
      toast('Tên hiển thị không được để trống.', 'bad');
      return;
    }
    if (cleanName.length > 100) {
      toast('Tên hiển thị tối đa 100 ký tự.', 'bad');
      return;
    }
    if (bio.length > 500) {
      toast('Giới thiệu tối đa 500 ký tự.', 'bad');
      return;
    }
    setSaving(true);
    try {
      const result = await api.updateProfile({ name: cleanName, username: username.trim(), avatar_url: avatarUrl.trim(), bio: bio.trim() }, token);
      setName(result.user.name);
      setUsername(result.user.username ?? '');
      setAvatarUrl(result.user.avatar_url ?? '');
      setBio(result.user.bio ?? '');
      onUserChange(result.user);
      toast('Đã lưu hồ sơ.');
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không lưu được hồ sơ.', 'bad');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (changing) return;
    if (currentPassword.length < 8) {
      toast('Nhập mật khẩu hiện tại.', 'bad');
      return;
    }
    if (nextPassword.length < 8 || nextPassword.length > 72) {
      toast('Mật khẩu mới cần từ 8 đến 72 ký tự.', 'bad');
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast('Hai lần nhập mật khẩu mới chưa khớp.', 'bad');
      return;
    }
    if (nextPassword === currentPassword) {
      toast('Mật khẩu mới phải khác mật khẩu hiện tại.', 'bad');
      return;
    }
    setChanging(true);
    try {
      await api.changePassword(currentPassword, nextPassword, token);
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      toast('Đã đổi mật khẩu. Các thiết bị khác đã đăng xuất.');
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không đổi được mật khẩu.', 'bad');
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="h1">Hồ sơ</h1>
          <p className="psub">Tên và vài dòng giới thiệu hiện với người cùng nhóm.</p>
        </div>
      </div>

      <div className="profile-grid">
        <aside className="profile-side">
          <Avatar name={user.name} url={user.avatar_url} size={64} />
          <div className="profile-name">{user.name}</div>
          {user.username ? <div className="profile-email">@{user.username}</div> : null}
          <div className="profile-email">{user.email}</div>
          {user.created_at ? (
            <div className="profile-since">Tham gia {formatJoined(user.created_at)}</div>
          ) : null}
        </aside>

        <div className="profile-main">
          <div className="shead tight">
            <h2 className="h2">Thông tin hiển thị</h2>
          </div>
          <form className="form" onSubmit={saveProfile} noValidate>
            <div>
              <label className="field-label" htmlFor="profile-name">
                Tên hiển thị
              </label>
              <input
                id="profile-name"
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="profile-username">Tên tài khoản</label>
              <input id="profile-username" className="field" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={32} placeholder="minhanh_01" autoComplete="username" />
              <p className="field-hint">Dùng để nhận diện bạn trong nhóm · 3–32 ký tự, chữ/số/._</p>
            </div>
            <div>
              <label className="field-label" htmlFor="profile-avatar">Ảnh đại diện · URL HTTPS</label>
              <input id="profile-avatar" className="field" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={500} placeholder="https://…" />
              <p className="field-hint">Có thể dán liên kết ảnh công khai để cá nhân hoá hồ sơ.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="profile-bio">
                Giới thiệu
              </label>
              <textarea
                id="profile-bio"
                className="field"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={500}
                placeholder="Ví dụ: học Khoa học máy tính, rảnh tối thứ Ba và thứ Năm."
              />
              <p className="field-hint">{bio.length} trên 500 ký tự</p>
            </div>
            <div className="actions">
              <button type="submit" className="btn" disabled={saving || !dirty}>
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
              {!dirty ? <span className="micro faint">Không có thay đổi</span> : null}
            </div>
          </form>

          <div className="shead">
            <h2 className="h2">Mật khẩu</h2>
          </div>
          <p className="small muted profile-note">
            Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác, chỉ giữ phiên đang dùng.
          </p>
          <form className="form" onSubmit={savePassword} noValidate>
            <div>
              <label className="field-label" htmlFor="profile-current">
                Mật khẩu hiện tại
              </label>
              <input
                id="profile-current"
                className="field"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="form-split">
              <div>
                <label className="field-label" htmlFor="profile-next">
                  Mật khẩu mới
                </label>
                <input
                  id="profile-next"
                  className="field"
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="profile-confirm">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  id="profile-confirm"
                  className="field"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>
            <div className="actions">
              <button
                type="submit"
                className="btn btn-ghost"
                disabled={
                  changing ||
                  currentPassword.length < 8 ||
                  nextPassword.length < 8 ||
                  confirmPassword.length < 8
                }
              >
                {changing ? 'Đang đổi…' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>

          <div className="shead">
            <h2 className="h2">Phiên làm việc</h2>
          </div>
          <p className="small muted profile-note">
            Đăng xuất khỏi thiết bị này. Dữ liệu nhóm vẫn giữ nguyên.
          </p>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
