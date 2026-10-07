import { useState } from 'react'
import { formatTimeAgo } from '../utils/format'

export default function LibraryScreen({ picks = [], favourites, recent, removedIds, onOpen, onFavourite, onClearRecent }) {
  const [tab, setTab] = useState('favourites')
  const places = tab === 'favourites' ? favourites : tab === 'picks' ? picks : recent
  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-2">
      {['favourites', 'picks', 'recent'].map(id => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 font-bold ${tab === id ? 'bg-candy-pink text-white' : 'bg-white'}`}>{id === 'favourites' ? '⭐ Favourites' : id === 'picks' ? '💖 Picks' : '🕒 Recent winners'}</button>)}
    </div>
    <p className="text-xs text-plum/60">Saved on this device. Recent winners are your last 20 different wheel picks.</p>
    {places.length === 0 && <p className="py-8 text-center text-plum/60">{tab === 'favourites' ? 'Save a favourite from a card or result to find it here.' : tab === 'picks' ? 'Swipe right to add your first pick.' : 'Spin a wheel to add your first winner.'}</p>}
    <ul className="flex flex-col gap-3">{places.map(place => <li key={place.id} className="flex items-center gap-3 rounded-3xl bg-white p-4">
      <button onClick={() => onOpen(place)} className="min-w-0 flex-1 text-left"><span className="block font-extrabold">{place.name}</span><span className="text-xs text-plum/60">{removedIds.has(place.id) ? 'Hidden on this device · restore in hidden places' : tab === 'recent' ? `Picked ${formatTimeAgo(place.wonAt)}` : 'View place and directions'}</span></button>
      <button aria-label={`${favourites.some(p => p.id === place.id) ? 'Unfavourite' : 'Favourite'} ${place.name}`} aria-pressed={favourites.some(p => p.id === place.id)} onClick={() => onFavourite(place)} className="rounded-full bg-cream p-3">{favourites.some(p => p.id === place.id) ? '★' : '☆'}</button>
    </li>)}</ul>
    {tab === 'recent' && recent.length > 0 && <button onClick={onClearRecent} className="self-end text-sm font-bold text-plum/60">Clear recent winners</button>}
  </div>
}
