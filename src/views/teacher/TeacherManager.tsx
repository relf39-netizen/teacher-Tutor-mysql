
import React, { useState, useEffect } from 'react';
import { Teacher, RegistrationRequest } from '../../types';
import { UserCog, CheckCircle, XCircle, Search, Save, Edit } from 'lucide-react';
import { supabase } from '../../services/supabaseConfig';

interface TeacherManagerProps {
  schoolName: string;
  currentAdminId: string;
}

const TeacherManager: React.FC<TeacherManagerProps> = ({ schoolName, currentAdminId }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Advisor Modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [advisorGrade, setAdvisorGrade] = useState('M1');
  const [advisorRoom, setAdvisorRoom] = useState('1');

  useEffect(() => {
    loadData();
  }, [schoolName]);

  const loadData = async () => {
    setLoading(true);
    // 1. Get Active Teachers in this school
    const { data: tData } = await supabase.from('teachers').select('*').eq('school', schoolName);
    
    // 2. Get Pending Requests
    const { data: rData } = await supabase.from('registration_requests').select('*').eq('status', 'pending');
    
    const { data: schoolData } = await supabase.from('schools').select('id').eq('name', schoolName).single();
    const schoolId = schoolData?.id;

    if (tData) {
        // ✅ FIX: Map DB columns (snake_case) to App types (camelCase)
        const mappedTeachers: Teacher[] = tData.map((t: any) => {
            // Helper for Safe Parse
            const safeParse = (str: any) => {
                if(!str) return [];
                if(typeof str === 'object') return str;
                try { return JSON.parse(str); } catch { return []; }
            };

            return {
                ...t,
                advisorClass: t.advisor_class, 
                gradeLevel: t.grade_level,
                teachingClasses: safeParse(t.teaching_classes)
            };
        });
        setTeachers(mappedTeachers);
    }

    if (rData && schoolId) {
        // ✅ FIX: Map DB columns (snake_case) to App types (camelCase)
        const mappedRequests = rData
            .filter((r:any) => r.school_id === schoolId)
            .map((r:any) => ({
                ...r,
                citizenId: r.citizen_id, // Map citizen_id -> citizenId
                schoolId: r.school_id    // Map school_id -> schoolId
            }));
        setRequests(mappedRequests);
    }
    setLoading(false);
  };

  const handleApprove = async (req: RegistrationRequest) => {
      // Debug check
      if (!req.citizenId) {
          alert("Error: ไม่พบเลขบัตรประชาชน (Data Mapping Error)");
          return;
      }

      // Create teacher account
      const { error } = await supabase.from('teachers').insert({
          username: req.citizenId, 
          password: '123456', // ✅ Default Password
          name: `${req.name} ${req.surname}`,
          school: schoolName,
          citizen_id: req.citizenId,
          role: 'TEACHER', // Default role
          status: 'active'
      });
      
      if (!error) {
          await supabase.from('registration_requests').update({ status: 'approved' }).eq('id', req.id);
          loadData();
      } else {
          alert("อนุมัติไม่สำเร็จ: " + error.message);
      }
  };

  const handleReject = async (reqId: string) => {
      await supabase.from('registration_requests').update({ status: 'rejected' }).eq('id', reqId);
      loadData();
  };

  const openAssignModal = (t: Teacher) => {
      setEditingTeacher(t);
      if (t.advisorClass) {
          const [g, r] = t.advisorClass.split('/');
          setAdvisorGrade(g || 'M1');
          setAdvisorRoom(r || '1');
      } else {
          setAdvisorGrade('M1');
          setAdvisorRoom('1');
      }
  };

  const saveAdvisorAssignment = async () => {
      if (!editingTeacher) return;
      const classString = `${advisorGrade}/${advisorRoom}`;
      
      const { error } = await supabase.from('teachers').update({
          advisor_class: classString
      }).eq('id', editingTeacher.id);

      if (!error) {
          alert(`✅ ตั้งครู ${editingTeacher.name} เป็นที่ปรึกษาชั้น ${classString} แล้ว`);
          setEditingTeacher(null);
          loadData();
      } else {
          alert("บันทึกไม่สำเร็จ");
      }
  };

  return (
    <div className="animate-fade-in">
        <h3 className="text-xl font-bold text-cyan-900 mb-6 flex items-center gap-2"><UserCog className="text-cyan-600"/> จัดการบุคลากรครู</h3>

        {/* Requests Section */}
        {requests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
                <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2"><CheckCircle size={18}/> คำขอสมัครสมาชิกใหม่ ({requests.length})</h4>
                <div className="space-y-2">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white p-3 rounded-lg border border-yellow-100 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="font-bold text-gray-800">{req.name} {req.surname}</span>
                                <div className="text-xs text-gray-500">ID: {req.citizenId}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove(req)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">อนุมัติ</button>
                                <button onClick={() => handleReject(req.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">ปฏิเสธ</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Teacher List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-cyan-50 text-cyan-800 font-bold border-b border-cyan-100">
                    <tr>
                        <th className="p-4">ชื่อ-นามสกุล</th>
                        <th className="p-4 text-center">บทบาท</th>
                        <th className="p-4 text-center">ครูที่ปรึกษาประจำชั้น</th>
                        <th className="p-4 text-right">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {teachers.map(t => (
                        <tr key={t.id} className="hover:bg-cyan-50/30 transition">
                            <td className="p-4 font-medium text-gray-800">
                                {t.name}
                                {String(t.id) === currentAdminId && <span className="ml-2 text-[10px] bg-gray-200 px-1 rounded text-gray-500">(คุณ)</span>}
                            </td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.role === 'SCHOOL_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {t.role === 'SCHOOL_ADMIN' ? 'Admin' : 'ครูผู้สอน'}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {t.advisorClass ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold shadow-sm border border-green-200">{t.advisorClass}</span>
                                ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => openAssignModal(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="ตั้งค่าชั้นเรียน">
                                    <Edit size={18}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Edit Modal */}
        {editingTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">ตั้งค่าครูที่ปรึกษา</h3>
                    <p className="text-sm text-gray-500 mb-4">ครู: <b>{editingTeacher.name}</b></p>
                    
                    <div className="flex gap-2 mb-6">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">ระดับชั้น</label>
                            <select value={advisorGrade} onChange={e => setAdvisorGrade(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50">
                                {['M1','M2','M3','M4','M5','M6'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">ห้อง</label>
                            <select value={advisorRoom} onChange={e => setAdvisorRoom(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50">
                                {Array.from({length: 15}, (_, i) => i + 1).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setEditingTeacher(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">ยกเลิก</button>
                        <button onClick={saveAdvisorAssignment} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg font-bold shadow hover:bg-cyan-700">บันทึก</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TeacherManager;
