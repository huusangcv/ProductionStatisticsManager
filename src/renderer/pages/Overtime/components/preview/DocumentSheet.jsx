// src/components/preview/DocumentSheet.jsx
import React, { memo } from "react";
import { LOGO_B64, MAX_ROWS } from "../../constants";

/**
 * DocumentSheet – Exact Excel replica table
 * Props:
 *   selArr          : Employee[]
 *   isSun           : boolean
 *   dateStr         : string
 *   deptName        : string
 *   otTimes         : object
 *   setEmployeeTime : (id, time) => void
 *   startIndex      : number  – STT bắt đầu (0-based offset); trang 1 = 0, trang 2 = MAX_ROWS, …
 *   notes           : object  – { [rowKey]: string } ghi chú editable
 *   setNote         : (rowKey, value) => void
 */
const DocumentSheet = memo(function DocumentSheet({
  selArr,
  isSun,
  dateStr,
  deptName,
  otTimes = {},
  setEmployeeTime = () => { },
  startIndex = 0,
  notes = {},
  setNote = () => { },
}) {
  const dataRows = Array.from({ length: MAX_ROWS }).map((_, i) => {
    const e = selArr[i] || null;
    // STT xuyên trang: trang 2 bắt đầu từ MAX_ROWS+1, v.v.
    const stt = startIndex + i + 1;
    // Key dùng cho notes: dùng id nếu có NV, dùng "row-<stt>" cho hàng trống
    const rowKey = e ? `emp-${e.id}` : `row-${stt}`;
    // Giá trị ghi chú mặc định: note của NV → isSun 'TG' → ''
    const defaultNote = e ? e.note || (isSun ? "" : "") : "";
    const noteValue = notes[rowKey] !== undefined ? notes[rowKey] : defaultNote;
    return (
      <tr key={i} className="drow">
        <td className="d-stt">{e ? stt : ""}</td>
        <td className={`d-id ${e ? "" : "d-empty"}`}>{e ? e.id : ""}</td>
        <td className={`d-name ${e ? "" : "d-empty"}`}>{e ? e.name : ""}</td>
        <td className="d-role">{e ? e.role || "CN" : ""}</td>
        <td className="d-time">
          {e && (
            <select
              className="time-input"
              value={otTimes[e.id] || ""}
              onChange={(evt) => setEmployeeTime(e.id, evt.target.value)}
            >
              <option value=""></option>
              <option value="4h00 - 5h00">4h00 - 5h00</option>
              <option value="4h00 - 5h30">4h00 - 5h30</option>
              <option value="4h00 - 6h00">4h00 - 6h00</option>
              <option value="4h00 - 6h30">4h00 - 6h30</option>
              <option value="4h00 - 7h00">4h00 - 7h00</option>
              <option value="4h00 - 7h30">4h00 - 7h30</option>
              <option value="16h30 - 17h00">16h30 - 17h00</option>
              <option value="16h30 - 17h30">16h30 - 17h30</option>
              <option value="16h30 - 18h00">16h30 - 18h00</option>
              <option value="16h30 - 18h30">16h30 - 18h30</option>
              <option value="16h30 - 19h30">16h30 - 19h30</option>
              <option value="16h30 - 20h00">16h30 - 20h00</option>
              <option value="16h30 - 20h30">16h30 - 20h30</option>
              <option value="16h30 - 21h00">16h30 - 21h00</option>
              <option value="16h30 - 21h30">16h30 - 21h30</option>
              <option value="16h30 - 22h00">16h30 - 22h00</option>
              <option value="16h30 - 22h30">16h30 - 22h30</option>
              <option value="16h30 - 23h00">16h30 - 23h00</option>
            </select>
          )}
        </td>
        <td className="d-sign"></td>
        <td className="d-note">
          {e && (
            <input
              type="text"
              className="note-input"
              value={noteValue}
              onChange={(evt) => setNote(rowKey, evt.target.value)}
              placeholder="Ghi chú…"
            />
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="sheet-wrap">
      <table className="xl-table">
        <colgroup>
          <col className="col-a" />
          <col className="col-b" />
          <col className="col-c" />
          <col className="col-d" />
          <col className="col-e" />
          <col className="col-f" />
          <col className="col-g" />
        </colgroup>
        <tbody>
          {/* Row 1: Company header */}
          <tr className="row1">
            <td colSpan="7" className="r1-cell" style={{ padding: 0 }}>
              <div className="r1-inner">
                <img
                  className="r1-logo"
                  src={`data:image/png;base64,${LOGO_B64}`}
                  alt="Kingdom Logo"
                />
                <div className="r1-text">
                  CÔNG TY TNHH THIẾT BỊ KIỂM SOÁT DÒNG CHẢY KINGDOM VIỆT NAM
                  <br />
                  <span style={{ fontSize: "11pt" }}>
                    越南鐵王流體控制設備責任有限公司
                  </span>
                </div>
              </div>
            </td>
          </tr>

          {/* Row 2: Title block */}
          <tr className="row2">
            <td colSpan="7" className="r2-cell">
              <div className="r2-title">ĐƠN XIN TỰ NGUYỆN LÀM THÊM GIỜ</div>
              <div className="r2-subtitle">自愿加班申请单</div>
              <div className="r2-body">
                <b>1. Điều kiện làm thêm giờ 加班條件:</b>
                <br />
                &nbsp;&nbsp;a. Xử lý sự cố sản xuất 處理生產故障
                <br />
                &nbsp;&nbsp;b. Giải quyết công việc cấp bách không thể trì hoãn
                處理不可拖延的緊急工作
                <br />
                &nbsp;&nbsp;c. Xử lý kịp thời các sản phẩm do yêu cầu nghiêm
                ngặt không thể bỏ dở được 及時處理產品生產問題
                <br />
                <b>2.</b> Chúng tôi tình nguyện phối hợp công ty để hoàn thành
                nhiệm vụ và để nâng cao thu nhập
                <br />
                &nbsp;&nbsp;&nbsp;我們願意配合公司完成任務以及增加自己收入
              </div>
            </td>
          </tr>

          {/* Row 3: Dept + Date */}
          <tr className="row3">
            <td colSpan="3" className="r3-dept">
              Bộ Phận 部门: {deptName}
            </td>
            <td className="r3-mid"></td>
            <td colSpan="3" className="r3-date">
              {dateStr}
            </td>
          </tr>

          {/* Row 4: Column headers */}
          <tr className="row4">
            <td className="hdr">
              STT
              <br />
              <span className="sub">序号</span>
            </td>
            <td className="hdr">
              Mã số thẻ
              <br />
              <span className="sub">工号</span>
            </td>
            <td className="hdr">
              Họ và tên
              <br />
              <span className="sub">员工姓名</span>
            </td>
            <td className="hdr">
              Chức vụ
              <br />
              <span className="sub">职务</span>
            </td>
            <td className="hdr">
              Thời gian làm thêm
              <br />
              <span className="sub">加班时间</span>
            </td>
            <td className="hdr">
              Ký tên
              <br />
              <span className="sub">签名</span>
            </td>
            <td className="hdr">
              Ghi chú
              <br />
              <span className="sub">备注</span>
            </td>
          </tr>

          {/* Data rows */}
          {dataRows}

          {/* Row 24: Summary */}
          <tr className="row24">
            <td colSpan="7" className="r24-cell">
              Gồm:
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Phần sữa &amp;
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Phần cơm :
            </td>
          </tr>

          {/* Row 25: Signatures */}
          {isSun ? (
            <tr className="row25-sun">
              <td colSpan="7" style={{ padding: 0, border: "none" }}>
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Xưởng trưởng{"\n"}廠長
                  </div>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Phòng nhân sự{"\n"}人事管
                  </div>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Chủ quản bộ phận{"\n"}部门主管
                  </div>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Khoa trưởng{"\n"}课长
                  </div>
                  <div
                    className="sig-cell"
                    style={{ flex: 1, borderRight: "none" }}
                  >
                    Tổ trưởng{"\n"}组长
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            <tr className="row25-tca">
              <td colSpan="7" style={{ padding: 0, border: "none" }}>
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Phòng nhân sự{"\n"}人事管
                  </div>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Chủ quản bộ phận{"\n"}部门主管
                  </div>
                  <div className="sig-cell" style={{ flex: 1 }}>
                    Khoa trưởng{"\n"}课长
                  </div>
                  <div
                    className="sig-cell"
                    style={{ flex: 1, borderRight: "none" }}
                  >
                    Tổ trưởng{"\n"}组长
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

export default DocumentSheet;
