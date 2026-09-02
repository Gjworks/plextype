"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, HardDrive, Zap } from "lucide-react";

const defaultStats = {
  cpu: 0,
  mem: 0,
  network: { down: "0.00", up: "0.00" },
  disk: 0,
  uptime: 0,
};

const SystemFlowWidget = () => {
  const [currentStats, setCurrentStats] = useState(defaultStats);

  useEffect(() => {
    const eventSource = new EventSource("/api/system/stats");

    eventSource.onmessage = (event) => {
      setCurrentStats(JSON.parse(event.data));
    };

    eventSource.onerror = (error) => {
      console.error("SSE 연결 오류:", error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <section className="flex min-h-[420px] flex-col rounded-xl border border-gray-200 bg-white p-8 dark:border-dark-800 dark:bg-dark-900">
      <header className="mb-12 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-100 px-2 py-0.5 dark:border-dark-800">
            <Zap size={10} className="text-gray-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">System Flow</span>
          </div>
          <div className="text-xl font-medium tracking-tight text-gray-800 dark:text-dark-100">Operational Overview</div>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[9px] font-bold uppercase text-gray-400">CPU Load</p>
          <p className="text-2xl font-light text-primary-600 dark:text-primary-300">{currentStats.cpu}%</p>
        </div>
      </header>

      <div className="flex-1 space-y-10">
        <MetricLine
          icon={<Globe size={12} />}
          label="Network"
          value={`${currentStats.network?.down || "0.00"} MB/s`}
          progress={Math.min((Number(currentStats.network?.down) || 0) * 10, 100)}
        />
        <MetricLine
          icon={<HardDrive size={12} />}
          label="Storage"
          value={`${currentStats.disk}%`}
          progress={currentStats.disk}
        />

        <div className="flex items-center justify-between border-t border-gray-50 pt-4 dark:border-dark-800">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Uptime</span>
          <span className="text-[12px] font-medium text-gray-600 dark:text-dark-300">
            {Math.floor(currentStats.uptime / 3600)}h {Math.floor((currentStats.uptime % 3600) / 60)}m
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-8 border-t border-gray-50 pt-7 dark:border-dark-800">
        <MiniStat label="Mem" value={`${currentStats.mem}%`} />
        <MiniStat label="Status" value="Active" color="text-primary-500 dark:text-primary-300" />
        <MiniStat label="Latency" value="1.2ms" />
      </div>
    </section>
  );
};

const MetricLine = ({
  icon,
  label,
  value,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress: number;
}) => (
  <div className="space-y-4">
    <div className="flex items-end justify-between">
      <div className="flex items-center gap-2 text-gray-300 dark:text-dark-600">
        {icon}
        <span className="text-[12px] font-medium text-gray-500 dark:text-dark-300">{label}</span>
      </div>
      <span className="text-[12px] font-mono text-gray-400">{value}</span>
    </div>
    <div className="h-[2px] w-full overflow-hidden bg-gray-50 dark:bg-dark-800">
      <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gray-900 dark:bg-primary-300" />
    </div>
  </div>
);

const MiniStat = ({ label, value, color = "text-gray-800" }: { label: string; value: string; color?: string }) => (
  <div>
    <p className="mb-1 text-[9px] font-bold uppercase text-gray-400">{label}</p>
    <p className={`text-[13px] font-medium dark:text-dark-100 ${color}`}>{value}</p>
  </div>
);

export default SystemFlowWidget;
