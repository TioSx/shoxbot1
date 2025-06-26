const Staff = require('../models/Staff');

async function getStaffRankingData() {
  const staffs = await Staff.find({});
  return staffs.map(staff => {
    const ticketsGlobal = staff.tickets.s1 + staff.tickets.s2 + staff.tickets.s3 + staff.tickets.s4;
    const avaliacoesAll = [
      ...(staff.avaliacoes.s1 || []),
      ...(staff.avaliacoes.s2 || []),
      ...(staff.avaliacoes.s3 || []),
      ...(staff.avaliacoes.s4 || [])
    ];
    const mediaGlobal = avaliacoesAll.length
      ? avaliacoesAll.reduce((a, b) => a + b, 0) / avaliacoesAll.length
      : 0;

    return {
      userId: staff.userId,
      cargos: staff.cargos,
      s1: staff.tickets.s1,
      s2: staff.tickets.s2,
      s3: staff.tickets.s3,
      s4: staff.tickets.s4,
      ticketsGlobal,
      mediaGlobal,
      media: {
        s1: staff.avaliacoes.s1.length ? staff.avaliacoes.s1.reduce((a, b) => a + b, 0) / staff.avaliacoes.s1.length : 0,
        s2: staff.avaliacoes.s2.length ? staff.avaliacoes.s2.reduce((a, b) => a + b, 0) / staff.avaliacoes.s2.length : 0,
        s3: staff.avaliacoes.s3.length ? staff.avaliacoes.s3.reduce((a, b) => a + b, 0) / staff.avaliacoes.s3.length : 0,
        s4: staff.avaliacoes.s4.length ? staff.avaliacoes.s4.reduce((a, b) => a + b, 0) / staff.avaliacoes.s4.length : 0,
      }
    };
  });
}

module.exports = getStaffRankingData;
