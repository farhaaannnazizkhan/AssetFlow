import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../utils/api';
import { Booking, Asset } from '../utils/api';

const localizer = momentLocalizer(moment);

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '', purpose: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchBookings();
  }, [selectedAsset]);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.map((b: Booking) => ({
        ...b,
        start: new Date(b.startTime),
        end: new Date(b.endTime),
        title: `${b.asset?.name || 'Asset'} - ${b.user?.name || 'User'}`,
      })));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/bookings', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      setShowModal(false);
      setForm({ assetId: '', startTime: '', endTime: '', purpose: '' });
      fetchBookings();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      fetchBookings();
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  };

  const calendarEvents = bookings.map(booking => ({
    ...booking,
    title: `${booking.asset?.name || 'Asset'} - ${booking.user?.name || 'User'}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resource Bookings</h1>
          <p className="text-slate-600 mt-1">Book and manage shared resources.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Book Resource
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Calendar View</h2>
        <div className="h-[500px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Bookings</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {bookings.map(booking => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {booking.asset?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(booking.startTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(booking.endTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {booking.purpose || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => cancelBooking(booking.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Book Resource</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={createBooking} className="space-y-4">
              <div>
                <label className="label">Asset *</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="input mt-1"
                  required
                >
                  <option value="">Select asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetTag} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="label">End Time *</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="label">Purpose</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="input mt-1"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
