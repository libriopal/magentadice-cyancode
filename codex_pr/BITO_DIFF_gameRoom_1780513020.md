Model in use: ADVANCED

Below is an explanation of the changes made in the diff along with annotated code examples to help clarify what the patch does.

---

### Summary of Changes

1. **Chain Length Validation:**
   - The code now checks if the provided chain length exceeds 6. If it does, an error is sent to the client with the message “Chain too long”.
   - This prevents the user from exploiting the game by submitting a chain that exceeds the allowed length.

2. **4-Way Adjacency Validation and Duplicate Prevention:**
   - This patch introduces a new validation loop that checks each consecutive pair of cells in the chain:
     - It ensures that each pair of adjacent cells in the chain are 4-way adjacent (sharing exactly one edge). The check is performed by calculating the Manhattan distance between consecutive cells and ensuring that the distance is exactly 1.
     - A Set (`seenCells`) is used to ensure that no cell appears more than once in the chain, guarding against the injection of non-adjacent or duplicate cells.
   - On failure, an error message “Invalid chain: non-adjacent tiles” is sent to the client.

3. **Column Adjacency Validation:**
   - For the case where chain columns are provided, consecutive columns are checked to ensure that they are either identical or adjacent (i.e., their difference is at most 1).
   - If this validation fails, an error with the message “Invalid chain: non-adjacent columns” is returned.

4. **Chain Length Clamping:**
   - The code clamps the variable `chainLength` to ensure it falls within the allowed range (1 to 6). If the provided chain length is not in this valid range, it falls back to the length of `faces`.

---

### Annotated Code Example

Below is an annotated version of the patch changes for further clarification:

```diff
@@ -209,6 +209,29 @@
           this.send(player.ws, { type: 'ERROR', message: 'Chain too short' });
           return;
         }
+        if (chain.length > 6) {
+          // Guard: If too many chain tiles provided, error out.
+          this.send(player.ws, { type: 'ERROR', message: 'Chain too long' });
+          return;
+        }
+        // Validate 4-way adjacency: each consecutive pair must share exactly one edge;
+        // no duplicate cells. Guards against non-adjacent face injection attacks.
+        const seenCells = new Set<string>();
+        let adjacencyOk = true;
+        for (let i = 0; i < chain.length; i++) {
+          const cell = chain[i]!;
+          const key = `${cell.row},${cell.col}`;
+          if (seenCells.has(key)) { adjacencyOk = false; break; }
+          seenCells.add(key);
+          if (i > 0) {
+            const prev = chain[i - 1]!;
+            // Validate that the cells are 4-way adjacent.
+            const dist = Math.abs(prev.row - cell.row) + Math.abs(prev.col - cell.col);
+            if (dist !== 1) { adjacencyOk = false; break; }
+          }
+        }
+        if (!adjacencyOk) {
+          // Error if chain validation failed.
+          this.send(player.ws, { type: 'ERROR', message: 'Invalid chain: non-adjacent tiles' });
+          return;
+        }
         this.processChain(playerId, chain);
         break;
       }
@@ -236,10 +259,26 @@
         const chainColumns = Array.isArray(msg.chainColumns)
           ? (msg.chainColumns as number[]).filter((c: unknown) => Number.isInteger(c) && (c as number) >= 0 && (c as number) <= 6)
           : [];
+        // Column adjacency: consecutive tiles must be in the same or adjacent column.
+        // Best validation available without full grid state (BUG-01 pending).
+        if (chainColumns.length === faces.length && chainColumns.length > 1) {
+          let colsOk = true;
+          for (let i = 1; i < chainColumns.length; i++) {
+            // Validate that columns are adjacent.
+            if (Math.abs(chainColumns[i]! - chainColumns[i - 1]!) > 1) { colsOk = false; break; }
+          }
+          if (!colsOk) {
+            // Error if column adjacency validation fails.
+            this.send(player.ws, { type: 'ERROR', message: 'Invalid chain: non-adjacent columns' });
+            return;
+          }
+        }
+        // Clamp chainLength to the valid face range to prevent banking-bypass exploits.
+        const validatedChainLength = typeof chainLength === 'number' && chainLength >= 1 && chainLength <= 6
+          ? chainLength
+          : faces.length;
         this.processChainFaces(
           playerId,
           faces as import('@match3d/farkle-shared').DieFace[],
-          typeof chainLength === 'number' ? chainLength : faces.length,
+          validatedChainLength,
           chainColumns,
         );
         break;
```

---

### Conclusion

This patch improves overall security and integrity of the gameplay by preventing:
- Chains that are too long.
- Duplicate or non-adjacent cells in a chain.
- Invalid column adjacency during chain processing.
- Data that could be exploited via banking-bypass and similar tactics.

These validations are crucial to maintaining a fair and robust game state while guarding against potential attacks or unintended gameplay mechanics.

