import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import knightdaleLogo from "@/assets/knightdale-logo.png";

interface Subject {
  id: string;
  subject_name: string;
  ca1_score: number;
  ca2_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  teacher_remark: string;
  class_average: number;
}

interface AffectiveTraits {
  punctuality: number;
  neatness: number;
  attendance: number;
  honesty: number;
  reliability: number;
  relationship_with_staff: number;
  relationship_with_students: number;
  self_control: number;
  attitude_to_school: number;
}

interface PsychomotorSkills {
  handwriting: number;
  reading: number;
  verbal_fluency: number;
  musical_skills: number;
  creative_arts: number;
  physical_education: number;
  general_reasoning: number;
}

interface SecondaryResultPrintTemplateProps {
  studentData: {
    name: string;
    admissionNo: string;
    classLevel: string;
    arm: string;
    gender: string;
    age: number;
  };
  academicData: {
    session: string;
    term: string;
    nextTermBegins: string;
  };
  performanceData: {
    position: number;
    totalStudents: number;
    studentTotal: number;
    studentAverage: number;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
  };
  attendanceData: {
    daysOpened: number;
    daysPresent: number;
    daysAbsent: number;
  };
  subjects: Subject[];
  affectiveTraits: AffectiveTraits;
  psychomotorSkills: PsychomotorSkills;
  remarks: {
    classTeacher: string;
    principal: string;
  };
  onClose: () => void;
}

const RatingDots = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full border border-gray-400 ${i <= rating ? 'bg-blue-600' : 'bg-white'}`}
      />
    ))}
  </div>
);

const SecondaryResultPrintTemplate: React.FC<SecondaryResultPrintTemplateProps> = ({
  studentData,
  academicData,
  performanceData,
  attendanceData,
  subjects,
  affectiveTraits,
  psychomotorSkills,
  remarks,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const gradingScale = [
    { grade: 'A1', range: '75-100', remark: 'Excellent' },
    { grade: 'B2', range: '70-74', remark: 'Very Good' },
    { grade: 'B3', range: '65-69', remark: 'Good' },
    { grade: 'C4', range: '60-64', remark: 'Credit' },
    { grade: 'C5', range: '55-59', remark: 'Credit' },
    { grade: 'C6', range: '50-54', remark: 'Credit' },
    { grade: 'D7', range: '45-49', remark: 'Pass' },
    { grade: 'E8', range: '40-44', remark: 'Pass' },
    { grade: 'F9', range: '0-39', remark: 'Fail' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - hidden when printing */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div ref={printRef} className="pt-16 print:pt-0 p-4 print:p-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none" style={{ minHeight: '297mm' }}>
          <div className="p-6 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
            
            {/* School Header */}
            <div className="text-center border-b-4 border-blue-600 pb-4 mb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src={knightdaleLogo} alt="School Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-blue-800 uppercase tracking-wide">
                    Knightdale Middle College
                  </h1>
                  <p className="text-sm text-gray-600">(Secondary Section of Priscilla School)</p>
                  <p className="text-sm text-red-600 font-semibold italic">"Redeeming The Time"</p>
                </div>
                <img src={knightdaleLogo} alt="School Logo" className="w-20 h-20 object-contain" />
              </div>
              <p className="text-sm text-gray-700">59, Oscar Ibru Way, Marine Road</p>
              <p className="text-sm text-gray-700">
                Tel: 08033021210, 08060466293 | Email: knightdalemiddlecolllege@gmail.com
              </p>
              <div className="mt-2 inline-block bg-blue-600 text-white px-6 py-1 rounded-full">
                <span className="font-bold">STUDENT TERMINAL REPORT</span>
              </div>
            </div>

            {/* Student Info & Academic Session */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="space-y-1 border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2">STUDENT INFORMATION</h3>
                <div className="grid grid-cols-2 gap-1">
                  <p><strong>Name:</strong> {studentData.name}</p>
                  <p><strong>Admission No:</strong> {studentData.admissionNo}</p>
                  <p><strong>Class:</strong> {studentData.classLevel} {studentData.arm}</p>
                  <p><strong>Gender:</strong> {studentData.gender}</p>
                  <p><strong>Age:</strong> {isNaN(studentData.age) ? 'N/A' : studentData.age} years</p>
                </div>
              </div>
              <div className="space-y-1 border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2">ACADEMIC SESSION</h3>
                <div className="grid grid-cols-2 gap-1">
                  <p><strong>Session:</strong> {academicData.session}</p>
                  <p><strong>Term:</strong> {academicData.term}</p>
                  <p className="col-span-2"><strong>Next Term Begins:</strong> {academicData.nextTermBegins || 'TBA'}</p>
                </div>
              </div>
            </div>

            {/* Performance Summary & Attendance */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2">CLASS PERFORMANCE SUMMARY</h3>
                <div className="grid grid-cols-2 gap-1">
                  <p><strong>Position:</strong> {performanceData.position} of {performanceData.totalStudents}</p>
                  <p><strong>Total Score:</strong> {performanceData.studentTotal}</p>
                  <p><strong>Student Average:</strong> {performanceData.studentAverage}%</p>
                  <p><strong>Class Average:</strong> {performanceData.classAverage}%</p>
                  <p><strong>Highest Average:</strong> {performanceData.highestAverage}%</p>
                  <p><strong>Lowest Average:</strong> {performanceData.lowestAverage}%</p>
                </div>
              </div>
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2">ATTENDANCE RECORD</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Days Opened</p>
                    <p className="text-xl font-bold text-blue-600">{attendanceData.daysOpened}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Days Present</p>
                    <p className="text-xl font-bold text-green-600">{attendanceData.daysPresent}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Days Absent</p>
                    <p className="text-xl font-bold text-red-600">{attendanceData.daysAbsent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Results Table */}
            <div className="mb-4">
              <h3 className="font-bold text-blue-800 border-b-2 border-blue-600 pb-1 mb-2">ACADEMIC RESULTS</h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-400 p-1 text-left">SUBJECT</th>
                    <th className="border border-gray-400 p-1 text-center w-12">CA1 (20)</th>
                    <th className="border border-gray-400 p-1 text-center w-12">CA2 (20)</th>
                    <th className="border border-gray-400 p-1 text-center w-14">EXAM (60)</th>
                    <th className="border border-gray-400 p-1 text-center w-14">TOTAL (100)</th>
                    <th className="border border-gray-400 p-1 text-center w-12">GRADE</th>
                    <th className="border border-gray-400 p-1 text-left">REMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, idx) => (
                    <tr key={subject.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-400 p-1 font-medium">{subject.subject_name}</td>
                      <td className="border border-gray-400 p-1 text-center">{subject.ca1_score}</td>
                      <td className="border border-gray-400 p-1 text-center">{subject.ca2_score}</td>
                      <td className="border border-gray-400 p-1 text-center">{subject.exam_score}</td>
                      <td className="border border-gray-400 p-1 text-center font-bold">{subject.total_score}</td>
                      <td className="border border-gray-400 p-1 text-center font-bold" style={{
                        color: subject.grade.startsWith('A') ? '#16a34a' : 
                               subject.grade.startsWith('B') ? '#2563eb' :
                               subject.grade.startsWith('C') ? '#ca8a04' :
                               subject.grade.startsWith('D') || subject.grade.startsWith('E') ? '#ea580c' : '#dc2626'
                      }}>{subject.grade}</td>
                      <td className="border border-gray-400 p-1 text-xs">{subject.teacher_remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grading Scale */}
            <div className="mb-4">
              <h3 className="font-bold text-blue-800 text-xs mb-1">GRADING SCALE</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {gradingScale.map(g => (
                  <span key={g.grade} className="bg-gray-100 px-2 py-0.5 rounded">
                    {g.grade}: {g.range} ({g.remark})
                  </span>
                ))}
              </div>
            </div>

            {/* Affective Traits & Psychomotor Skills */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2 text-sm">AFFECTIVE TRAITS</h3>
                <div className="space-y-1 text-xs">
                  {Object.entries(affectiveTraits).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <RatingDots rating={value} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 border-b pb-1 mb-2 text-sm">PSYCHOMOTOR SKILLS</h3>
                <div className="space-y-1 text-xs">
                  {Object.entries(psychomotorSkills).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <RatingDots rating={value} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-3 mb-4">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-blue-800 text-sm">CLASS TEACHER'S REMARK</h3>
                <p className="text-sm italic border-b border-dotted border-gray-400 min-h-[24px] pb-1">
                  {remarks.classTeacher || '_____________________________________________________'}
                </p>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Signature: ___________________</span>
                  <span>Date: ___________________</span>
                </div>
              </div>
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold text-red-700 text-sm">PRINCIPAL'S REMARK</h3>
                <p className="text-sm italic border-b border-dotted border-gray-400 min-h-[24px] pb-1">
                  {remarks.principal || '_____________________________________________________'}
                </p>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Signature & Stamp: ___________________</span>
                  <span>Date: ___________________</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t pt-2">
              <p>This result is computer-generated and is valid without signature when verified online.</p>
              <p className="font-semibold text-blue-600">Knightdale Middle College - Excellence in Education</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
          .print\\:hidden { display: none !important; }
          .print\\:pt-0 { padding-top: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SecondaryResultPrintTemplate;
