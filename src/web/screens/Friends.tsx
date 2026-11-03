import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import * as api from '../lib/api';
import type { FriendRequest, Friends as FriendsData, Notification, User } from '../lib/api';
import { isOnline, relative } from '../lib/format';
import { useToast } from '../components/Toast';
import { Avatar, EmptyState, ErrorBar, SkeletonRows } from '../components/ui';

const EMPTY: FriendsData = { friends: [], incoming: [], outgoing: [] };

export function Friends({ token }: { token: string }) {
  const toast = useToast();
  const [data, setData] = useState<FriendsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [busyRequest, setBusyRequest] = useState<number | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [sendingTo, setSendingTo] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const next = await api.getFriends(token, controller.signal);
        if (active) setData(next);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Không tải được danh sách bạn bè.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, reloadKey]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const refresh = useCallback(async () => {
    try {
      const next = await api.getFriends(token);
      if (alive.current) setData(next);
    } catch {
      /* lần tải nền thất bại: giữ dữ liệu đang thấy */
    }
  }, [token]);

  useEffect(() => {
    const onNotification = (event: Event) => {
      const notification = (event as CustomEvent<Notification>).detail;
      if (notification?.type.startsWith('friend')) void refresh();
    };
    window.addEventListener('studysync:notification', onNotification);
    return () => window.removeEventListener('studysync:notification', onNotification);
  }, [refresh]);

  const toggleSearch = () => {
    setSearchOpen((open) => {
      const next = !open;
      if (next) {
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      return next;
    });
  };

  const answer = async (request: FriendRequest, action: 'accept' | 'decline') => {
    if (busyRequest !== null) return;
    setBusyRequest(request.request_id);
    try {
      await api.respondFriendRequest(request.request_id, action, token);
      setData((current) => ({
        ...current,
        incoming: current.incoming.filter((item) => item.request_id !== request.request_id),
        friends:
          action === 'accept'
            ? [...current.friends, { ...request, friendship_id: undefined }]
            : current.friends,
      }));
      toast(
        action === 'accept'
          ? `Đã kết bạn với ${request.name}.`
          : `Đã bỏ qua lời mời của ${request.name}.`,
      );
      void refresh();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không xử lý được lời mời.', 'bad');
    } finally {
      setBusyRequest(null);
    }
  };

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = query.trim();
    if (clean.length < 2) {
      toast('Nhập ít nhất 2 ký tự để tìm.', 'bad');
      return;
    }
    setSearching(true);
    try {
      const people = await api.searchUsers(clean, token);
      const known = new Set(
        [...data.friends, ...data.incoming, ...data.outgoing].map((person) => person.id),
      );
      setResults(people.filter((person) => !known.has(person.id)));
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không tìm được người dùng.', 'bad');
    } finally {
      setSearching(false);
    }
  };

  const invite = async (person: User) => {
    if (sendingTo !== null) return;
    setSendingTo(person.id);
    try {
      await api.sendFriendRequest(person.id, token);
      setResults((current) => current.filter((item) => item.id !== person.id));
      toast(`Đã gửi lời mời tới ${person.name}.`);
      void refresh();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không gửi được lời mời.', 'bad');
    } finally {
      setSendingTo(null);
    }
  };

  const { friends, incoming, outgoing } = data;

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="h1">Bạn bè</h1>
          <p className="psub">
            Giữ danh sách người học cùng ở một chỗ, để lần sau mời vào nhóm chỉ còn một bước.
          </p>
        </div>
        <div className="actions">
          <span className="micro faint num">
            {friends.length} người
          </span>
          <button type="button" className="btn-quiet" onClick={toggleSearch}>
            {searchOpen ? 'Đóng' : 'Tìm người'}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <form className="findform" onSubmit={search} noValidate>
          <div className="findform-row">
            <input
              ref={inputRef}
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên hoặc email"
              aria-label="Tìm người để kết bạn"
              autoComplete="off"
            />
            <button type="submit" className="btn" disabled={searching || query.trim().length < 2}>
              {searching ? 'Đang tìm…' : 'Tìm'}
            </button>
          </div>
          {results.length > 0 ? (
            <div className="findform-results">
              {results.map((person) => (
                <div className="search-result" key={person.id}>
                  <div className="result-person">
                    <Avatar name={person.name} url={person.avatar_url} size={30} />
                    <div className="result-text">
                      <div className="member-name">{person.name}</div>
                      <div className="member-sub">{person.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void invite(person)}
                    disabled={sendingTo !== null}
                  >
                    {sendingTo === person.id ? 'Đang gửi…' : 'Kết bạn'}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </form>
      ) : null}

      {error ? (
        <div style={{ marginTop: 18 }}>
          <ErrorBar message={error} onRetry={reload} />
        </div>
      ) : null}

      {loading ? (
        <SkeletonRows rows={3} />
      ) : (
        <>
          {incoming.length > 0 ? (
            <section>
              <div className="shead tight">
                <h2 className="h2">Lời mời kết bạn</h2>
                <span className="micro faint num">{incoming.length}</span>
              </div>
              {incoming.map((request) => (
                <div className="member" key={request.request_id}>
                  <Avatar name={request.name} url={request.avatar_url} size={34} />
                  <div>
                    <div className="member-name">{request.name}</div>
                    <div className="member-sub">
                      {request.email} · {relative(request.created_at)}
                    </div>
                  </div>
                  <div className="rowacts">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busyRequest !== null}
                      onClick={() => void answer(request, 'accept')}
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      className="btn-quiet"
                      disabled={busyRequest !== null}
                      onClick={() => void answer(request, 'decline')}
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <div className={incoming.length > 0 ? 'shead' : 'shead tight'}>
            <h2 className="h2">Đang học cùng</h2>
            <span className="micro faint num">{friends.length}</span>
          </div>

          {friends.length === 0 ? (
            <EmptyState
              title="Chưa có ai trong danh sách."
              action={
                <button type="button" className="btn" onClick={toggleSearch}>
                  Tìm người để kết bạn
                </button>
              }
            >
              Kết bạn với người cùng lớp để lần sau mời vào nhóm nhanh hơn, và thấy ai đang hoạt động.
            </EmptyState>
          ) : (
            friends.map((person) => (
              <div className="member" key={person.id}>
                <Avatar name={person.name} url={person.avatar_url} size={34} />
                <div>
                  <div className="member-name">{person.name}</div>
                  <div className="member-sub">{person.email}</div>
                </div>
                <span className="member-role">{isOnline(person.last_seen_at) ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
              </div>
            ))
          )}

          {outgoing.length > 0 ? (
            <section>
              <div className="shead">
                <h2 className="h2">Đã gửi lời mời</h2>
                <span className="micro faint num">{outgoing.length}</span>
              </div>
              {outgoing.map((person) => (
                <div className="member" key={person.request_id}>
                  <Avatar name={person.name} url={person.avatar_url} size={34} />
                  <div>
                    <div className="member-name">{person.name}</div>
                    <div className="member-sub">{person.email}</div>
                  </div>
                  <span className="member-role">Đang chờ · {relative(person.created_at)}</span>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
