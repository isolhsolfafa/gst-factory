import React, { useState, useEffect } from 'react';

     const SummaryTable = ({ data = { summary_table: [], weekly_production: [], weekly_production_message: '' } }) => {
       console.log("SummaryTable data:", data); // 디버깅용 로그 추가
       const [currentSlide, setCurrentSlide] = useState(0);

       // data가 undefined이거나 summary_table이 없는 경우를 처리
       const summaryTableData = data && data.summary_table ? data.summary_table : [];
       const weeklyProductionData = data && data.weekly_production ? data.weekly_production : [];
       const weeklyProductionMessage = data && data.weekly_production_message ? data.weekly_production_message : "최근 1주일 동안 생산 데이터가 없습니다.";

       useEffect(() => {
         const interval = setInterval(() => {
           setCurrentSlide((prev) => (prev + 1) % Math.ceil(summaryTableData.length / 7));
         }, 5000);
         return () => clearInterval(interval);
       }, [summaryTableData]);

       const slides = [];
       for (let i = 0; i < summaryTableData.length; i += 7) {
         slides.push(summaryTableData.slice(i, i + 7));
       }

       const renderProgressBar = (progress) => {
         if (progress === 100) {
           return <span style={{ fontSize: '16px' }}>✅</span>;
         } else if (progress >= 50) {
           return (
             <>
               <div style={{ width: `${progress}%`, backgroundColor: 'orange', height: '12px', borderRadius: '3px' }}></div>
               <span style={{ fontSize: '12px' }}>{progress.toFixed(1)}%</span>
             </>
           );
         } else {
           return (
             <>
               <div style={{ width: `${progress}%`, backgroundColor: 'red', height: '12px', borderRadius: '3px' }}></div>
               <span style={{ fontSize: '12px' }}>{progress.toFixed(1)}%</span>
             </>
           );
         }
       };

       return (
         <div>
           <h2>📋 생산 요약 테이블 [Planned Mech]</h2>
           {/* Weekly Production Message 표시 */}
           {weeklyProductionData.length === 0 && (
             <div style={{ marginBottom: '10px', color: '#888' }}>
               {weeklyProductionMessage}
             </div>
           )}
           <div id="summary-table-slide">
             {slides.length > 0 ? (
               slides.map((slide, index) => (
                 <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={index}>
                   <table border="1" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
                     <thead>
                       <tr style={{ backgroundColor: '#f2f2f2' }}>
                         <th>Title Number</th>
                         <th>모델명</th>
                         <th>기구협력사</th>
                         <th>전장협력사</th>
                         <th>기구 진행률</th>
                         <th>전장 진행률</th>
                         <th>반제품 진행률</th>
                       </tr>
                     </thead>
                     <tbody>
                       {slide.map(item => (
                         <tr key={item.title_number}>
                           <td>{item.title_number}</td>
                           <td>{item.model_name}</td>
                           <td>{item.mech_partner}</td>
                           <td>{item.elec_partner}</td>
                           <td>{renderProgressBar(item.mech_progress)}</td>
                           <td>{renderProgressBar(item.elec_progress)}</td>
                           <td>{renderProgressBar(item.tms_progress)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ))
             ) : (
               <div>데이터가 없습니다.</div>
             )}
           </div>
           {slides.length > 1 && (
             <>
               <div className="slide-controls">
                 <button onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}>이전</button>
                 <button onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}>다음</button>
               </div>
               <div className="slide-indicators">
                 {slides.map((_, index) => (
                   <span
                     key={index}
                     className={index === currentSlide ? 'active' : ''}
                     onClick={() => setCurrentSlide(index)}
                   ></span>
                 ))}
               </div>
             </>
           )}
         </div>
       );
     };

     export default SummaryTable;