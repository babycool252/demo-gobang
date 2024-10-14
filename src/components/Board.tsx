import React from 'react'

interface Move {
  index: number;
  player: 'black' | 'white';
  sequence: number;
}

interface BoardProps {
  board: (null | Move)[]
  onCellClick: (index: number) => void
  showSequence: boolean
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, showSequence }) => {
  const BOARD_SIZE = 15
  const CELL_SIZE = 30

  return (
    <div className="relative" style={{ width: CELL_SIZE * (BOARD_SIZE - 1), height: CELL_SIZE * (BOARD_SIZE - 1) }}>
      {/* Horizontal lines */}
      {Array.from({ length: BOARD_SIZE }).map((_, i) => (
        <div
          key={`h${i}`}
          className="absolute bg-gray-700"
          style={{
            left: 0,
            top: i * CELL_SIZE,
            width: '100%',
            height: '1px',
          }}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: BOARD_SIZE }).map((_, i) => (
        <div
          key={`v${i}`}
          className="absolute bg-gray-700"
          style={{
            top: 0,
            left: i * CELL_SIZE,
            width: '1px',
            height: '100%',
          }}
        />
      ))}
      {/* Intersection points and pieces */}
      {board.map((cell, index) => {
        const x = index % BOARD_SIZE
        const y = Math.floor(index / BOARD_SIZE)
        return (
          <div
            key={index}
            className="absolute cursor-pointer"
            style={{
              left: x * CELL_SIZE - CELL_SIZE / 2,
              top: y * CELL_SIZE - CELL_SIZE / 2,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            onClick={() => onCellClick(index)}
          >
            {cell && (
              <div
                className={`absolute rounded-full flex items-center justify-center ${
                  cell.player === 'black' ? 'bg-black' : 'bg-white border-2 border-black'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: CELL_SIZE * 0.8,
                  height: CELL_SIZE * 0.8,
                }}
              >
                {showSequence && (
                  <span
                    className={`text-xs font-bold ${
                      cell.player === 'black' ? 'text-white' : 'text-black'
                    }`}
                  >
                    {cell.sequence}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Board