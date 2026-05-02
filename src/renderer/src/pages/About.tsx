import Versions from '../components/Versions'

function About(): React.JSX.Element {
  return (
    <div className="bg-paper-grain min-h-full">
      <div className="flex items-stretch border-b-[3px] border-ink">
        <div className="flex items-center gap-3 bg-ink px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone">
          <span>SECTION_03</span>
          <span className="text-bone/50">/</span>
          <span className="font-jp tracking-[0.2em]">AKAI</span>
        </div>
        <div className="bg-stripes h-8 flex-1" />
      </div>

      <div className="p-8">
        <header className="border-b-[3px] border-ink pb-4">
          <div className="font-mono text-[11px] font-bold tracking-[0.4em] text-vermillion">
            ※ AKAI GAME LAUNCHER / 情報
          </div>
          <h1 className="mt-2 flex items-end gap-4 font-sans text-[64px] font-black leading-none tracking-[-0.04em]">
            ABOUT
            <span className="font-jp-serif text-[40px] font-bold text-ink/60">情報</span>
          </h1>
        </header>

        <section className="mt-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="border-[3px] border-ink bg-bone p-6">
              <h2 className="mb-4 font-sans text-[28px] font-black leading-tight tracking-[-0.03em]">
                AKAI GAME LAUNCHER
              </h2>
              <p className="font-sans text-[16px] leading-relaxed text-ink">
                A modern desktop game launcher built to organize, scan, and launch your game library from a single interface. Designed with a brutalist aesthetic — Japanese composition meets raw construction.
              </p>
              <p className="mt-4 font-mono text-[12px] leading-[1.7] tracking-wide text-ink/75">
                FEATURES INCLUDE: LIBRARY MANAGEMENT, GAME SCANNING, CUSTOM GAME ADDITION, COLLECTION ORGANIZATION, OVERLAY SUPPORT, AND SESSION TRACKING — ALL WRAPPED IN A CLEAN, FAST REACT + ELECTRON ARCHITECTURE.
              </p>
              <p className="mt-3 font-jp text-[13px] leading-[1.9] tracking-[0.1em] text-ink/65">
                モダンなゲームランチャー。ライブラリ管理、スキャン、コレクション整理、オーバーレイ対応を単一インターフェースで。React と Electron で構築された高速なデスクトップアプリケーション。
              </p>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="font-sans text-[22px] font-black tracking-tight">TECH STACK</h2>
                <span className="font-jp-serif text-[16px] font-bold text-ink/60">技術スタック</span>
              </div>
              <Versions />
            </div>
          </div>

          {/* Side card with seal */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="border-[3px] border-ink bg-bone">
              <div className="border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
                CREDITS · 製作
              </div>
              <div className="flex flex-col items-center gap-4 p-6">
                <div className="relative h-[140px] w-[140px] rounded-full bg-vermillion">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-bone">
                    <span className="font-jp-serif text-[40px] font-black leading-none">印</span>
                    <span className="mt-1 font-mono text-[8px] font-bold tracking-[0.3em]">
                      SEAL
                    </span>
                  </div>
                </div>
                <ul className="w-full divide-y-[2px] divide-ink border-t-[2px] border-ink font-mono text-[11px] tracking-[0.2em]">
                    <li className="flex justify-between py-2">
                    <span className="text-ink/60">EDITION</span>
                    <span className="font-bold">0.5.0</span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span className="text-ink/60">AUTHOR</span>
                    <span className="font-bold">NamaeTachii</span>
                  </li>
                    <li className="flex justify-between py-2">
                    <span className="text-ink/60">LICENSE</span>
                    <span className="font-bold">MIT</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

export default About
