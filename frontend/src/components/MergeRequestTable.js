import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link } from '@material-ui/core';

function MergeRequestTable({ mergeRequests }) {
  const calculateDaysOpen = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Days Open</TableCell>
            <TableCell>Participants</TableCell>
            <TableCell>MR ID</TableCell>
            <TableCell>Title</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mergeRequests.map((mr) => (
            <TableRow key={mr.id}>
              <TableCell>{calculateDaysOpen(mr.created_at)}</TableCell>
              <TableCell>{mr.participants ? mr.participants.length : 'N/A'}</TableCell>
              <TableCell>{mr.iid}</TableCell>
              <TableCell>
                <Link href={mr.web_url} target="_blank" rel="noopener noreferrer">
                  {mr.title}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MergeRequestTable;
