"use client";

import React from "react";
import { motion } from "framer-motion";

// ==========================================
// 1. 공통 노드 컴포넌트 (카드 UI)
// ==========================================
interface NodeProps {
  type: "trigger" | "action" | "condition" | "database";
  title: string;
  desc: string;
  badge: string;
  delay?: number;
}

const WorkflowNode = ({ type, title, desc, badge, delay = 0 }: NodeProps) => {
  const styles = {
    trigger: { bg: "bg-pink-100", text: "text-pink-700", label: "TRIGGER" },
    action: { bg: "bg-blue-100", text: "text-blue-700", label: "ACTION" },
    condition: { bg: "bg-purple-100", text: "text-purple-700", label: "IF / ELSE" },
    database: { bg: "bg-yellow-100", text: "text-yellow-700", label: "DATABASE" },
  };

  const currentStyle = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative z-10 w-72 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden"
    >
      {/* 헤더 영역 */}
      <div className={`flex items-center justify-between px-4 py-2 ${currentStyle.bg}`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStyle.text}`}>
          {currentStyle.label}
        </span>
        <span className="rounded bg-white/60 px-2 py-0.5 text-[10px] font-medium text-gray-700">
          {badge}
        </span>
      </div>
      {/* 바디 영역 */}
      <div className="p-4">
        <h4 className="text-sm font-bold text-gray-800 !mb-2">{title}</h4>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

// ==========================================
// 2. 연결선 컴포넌트
// ==========================================
const VerticalLine = ({ height = "h-8" }: { height?: string }) => (
  <div className={`w-px bg-gray-300 ${height}`} />
);

const BranchLine = ({ labelTrue = "Is true", labelFalse = "Is false" }) => (
  <div className="relative flex w-full justify-center mt-2">
    {/* 부모와 연결되는 중앙 선 */}
    <div className="absolute -top-2 left-1/2 h-4 w-px -translate-x-1/2 bg-gray-300" />
    {/* 양옆으로 갈라지는 가로 선 */}
    <div className="absolute top-2 left-[25%] right-[25%] h-px bg-gray-300" />

    {/* 왼쪽(False) 텍스트와 세로선 */}
    <div className="relative flex w-1/2 flex-col items-center pt-2">
      <div className="absolute top-2 left-1/2 h-6 w-px -translate-x-1/2 bg-gray-300" />
      <span className="absolute top-0 -ml-8 bg-[#f8fafc] px-2 text-[10px] text-gray-400">
        {labelFalse}
      </span>
    </div>

    {/* 오른쪽(True) 텍스트와 세로선 */}
    <div className="relative flex w-1/2 flex-col items-center pt-2">
      <div className="absolute top-2 left-1/2 h-6 w-px -translate-x-1/2 bg-gray-300" />
      <span className="absolute top-0 ml-8 bg-[#f8fafc] px-2 text-[10px] text-gray-400">
        {labelTrue}
      </span>
    </div>
  </div>
);


// ==========================================
// 3. 메인 워크플로우 조립
// ==========================================
export default function WorkflowDiagram() {
  return (
    // 도트 배경 패턴 적용
    <div
      className="min-h-screen w-full bg-[#f8fafc] py-20 flex justify-center overflow-x-auto"
      style={{
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="flex flex-col items-center">

        {/* Step 1: Trigger */}
        <WorkflowNode
          type="trigger"
          title="Starting point"
          desc="Form Submit (Register/Update)"
          badge="Client"
          delay={0}
        />
        <VerticalLine />

        {/* Step 2: API Call */}
        <WorkflowNode
          type="action"
          title="Fetch API (/api/user)"
          desc="Send FormData with credentials"
          badge="Data"
          delay={0.2}
        />
        <VerticalLine />

        {/* Step 3: Zod Validation */}
        <WorkflowNode
          type="condition"
          title="Zod Schema Validation"
          desc="Check email format & password rules"
          badge="Conditions"
          delay={0.4}
        />
        <BranchLine />

        {/* Zod Branching */}
        <div className="flex w-[600px] justify-between">
          {/* Left: Validation Failed */}
          <div className="flex flex-col items-center mt-6">
            <WorkflowNode
              type="action"
              title="Return 400 Error"
              desc="Send error field (element) & message"
              badge="UI Focus"
              delay={0.6}
            />
          </div>

          {/* Right: Validation Success -> DB Check */}
          <div className="flex flex-col items-center mt-6">
            <WorkflowNode
              type="condition"
              title="DB Duplicate Check"
              desc="Query existing ID / Email / Nickname"
              badge="Conditions"
              delay={0.6}
            />
            <BranchLine />

            {/* DB Check Branching */}
            <div className="flex w-[600px] justify-between">
              {/* Left: DB Duplicated */}
              <div className="flex flex-col items-center mt-6">
                <WorkflowNode
                  type="action"
                  title="Return 409 Conflict"
                  desc="Already exists error message"
                  badge="UI Alert"
                  delay={0.8}
                />
              </div>

              {/* Right: DB Clear -> Create/Update */}
              <div className="flex flex-col items-center mt-6">
                <WorkflowNode
                  type="database"
                  title="Prisma Query"
                  desc="Create or Update user record in DB"
                  badge="DB"
                  delay={0.8}
                />
                <VerticalLine />
                <WorkflowNode
                  type="action"
                  title="Success Response 201"
                  desc="Redirect to Sign In page"
                  badge="Client"
                  delay={1.0}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}