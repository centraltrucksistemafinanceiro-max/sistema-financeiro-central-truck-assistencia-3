import React from 'react';
import { useSettings } from '../App';
import { WALLPAPERS, THEME_COLORS } from '../constants';

const Personalization: React.FC = () => {
    const { wallpaper, themeColor, setWallpaper, setThemeColor } = useSettings();

    return (
        <div className="text-white h-full flex flex-col gap-8 p-4">
            <div>
                <h2 className="text-xl font-bold mb-4 text-slate-200">Papel de Parede</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {WALLPAPERS.map((url, index) => (
                        <div
                            key={index}
                            onClick={() => setWallpaper(url)}
                            className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${wallpaper === url ? 'border-blue-500 scale-105' : 'border-transparent'} hover:border-blue-400`}
                        >
                            <img src={url} alt={`Wallpaper ${index + 1}`} className="w-full h-full object-cover" />
                            {wallpaper === url && (
                                <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4 text-slate-200">Cor do Tema dos Ícones</h2>
                <div className="flex flex-wrap gap-4">
                    {THEME_COLORS.map((color) => (
                        <div
                            key={color.name}
                            onClick={() => setThemeColor(color.class)}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white/10"
                        >
                            <div className={`w-10 h-10 p-1 rounded-full border-2 transition-colors ${themeColor === color.class ? 'border-white' : 'border-slate-500'}`}>
                                <div className={`w-full h-full rounded-full ${color.bg}`}></div>
                            </div>
                            <span className="font-semibold">{color.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Personalization;
