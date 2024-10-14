import React, { useState, useCallback, useEffect } from 'react'
import Board from './components/Board'

const BOARD_SIZE = 15

interface Move {
  index: number;
  player: 'black' | 'white';
  sequence: number;
}

function App() {
  const [board, setBoard] = useState<(null | Move)[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [winner, setWinner] = useState<null | 'black' | 'white'>(null)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [isReplaying, setIsReplaying] = useState(false)
  const [isReplayComplete, setIsReplayComplete] = useState(false)
  const [showSequence, setShowSequence] = useState(false)
  const [isAIMode, setIsAIMode] = useState(false)

  useEffect(() => {
    if (isAIMode && currentPlayer === 'white' && !winner) {
      const aiMove = findBestMove(board)
      if (aiMove !== null) {
        setTimeout(() => makeMove(aiMove), 500)
      }
    }
  }, [isAIMode, currentPlayer, winner, board])

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isReplaying || isReplayComplete) return
    if (isAIMode && currentPlayer === 'white') return // Prevent clicks during AI's turn

    makeMove(index)
  }

  const makeMove = (index: number) => {
    const newMove: Move = { index, player: currentPlayer, sequence: moveHistory.length + 1 }
    const newBoard = [...board]
    newBoard[index] = newMove
    setBoard(newBoard)
    setMoveHistory([...moveHistory, newMove])

    if (checkWinner(newBoard, index)) {
      setWinner(currentPlayer)
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black')
    }
  }

  const checkWinner = (board: (null | Move)[], index: number): boolean => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ]

    const player = board[index]?.player
    if (!player) return false

    for (const [dx, dy] of directions) {
      let count = 1
      let x = index % BOARD_SIZE
      let y = Math.floor(index / BOARD_SIZE)

      for (let i = 1; i < 5; i++) {
        const newX = x + i * dx
        const newY = y + i * dy
        if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) break
        if (board[newY * BOARD_SIZE + newX]?.player !== player) break
        count++
      }

      for (let i = 1; i < 5; i++) {
        const newX = x - i * dx
        const newY = y - i * dy
        if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) break
        if (board[newY * BOARD_SIZE + newX]?.player !== player) break
        count++
      }

      if (count >= 5) return true
    }

    return false
  }

  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null))
    setCurrentPlayer('black')
    setWinner(null)
    setMoveHistory([])
    setIsReplaying(false)
    setIsReplayComplete(false)
    setShowSequence(false)
    setIsAIMode(false)
  }, [])

  const replayGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null))
    setIsReplaying(true)
    setIsReplayComplete(false)
    setWinner(null)
    setCurrentPlayer('black')
    setShowSequence(true)

    moveHistory.forEach((move, index) => {
      setTimeout(() => {
        setBoard(prevBoard => {
          const newBoard = [...prevBoard]
          newBoard[move.index] = move
          return newBoard
        })

        if (index === moveHistory.length - 1) {
          setIsReplaying(false)
          setIsReplayComplete(true)
        }
      }, (index + 1) * 1000) // Replay each move with a 1-second delay
    })
  }, [moveHistory])

  const startAIGame = useCallback(() => {
    resetGame()
    setIsAIMode(true)
  }, [resetGame])

  // Advanced AI strategy
  const findBestMove = (board: (null | Move)[]): number | null => {
    const centerIndex = Math.floor(BOARD_SIZE * BOARD_SIZE / 2)
    const emptyCells = board.reduce((acc, cell, index) => !cell ? [...acc, index] : acc, [] as number[])
    
    // Priority 1: Win the game if possible
    const winningMove = findWinningMove(board, 'white')
    if (winningMove !== null) return winningMove

    // Priority 2: Block opponent's winning move
    const blockingMove = findWinningMove(board, 'black')
    if (blockingMove !== null) return blockingMove

    // Priority 3: Create a fork (two winning threats)
    const forkMove = findForkMove(board, 'white')
    if (forkMove !== null) return forkMove

    // Priority 4: Block opponent's fork
    const blockForkMove = findForkMove(board, 'black')
    if (blockForkMove !== null) return blockForkMove

    // Priority 5: Play center if it's empty
    if (!board[centerIndex]) return centerIndex

    // Priority 6: Play a move that creates the most opportunities
    return findBestOpportunity(board, emptyCells)
  }

  const findWinningMove = (board: (null | Move)[], player: 'black' | 'white'): number | null => {
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        const testBoard = [...board]
        testBoard[i] = { index: i, player, sequence: 0 }
        if (checkWinner(testBoard, i)) return i
      }
    }
    return null
  }

  const findForkMove = (board: (null | Move)[], player: 'black' | 'white'): number | null => {
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        const testBoard = [...board]
        testBoard[i] = { index: i, player, sequence: 0 }
        let winningMoves = 0
        for (let j = 0; j < board.length; j++) {
          if (!testBoard[j]) {
            const nextBoard = [...testBoard]
            nextBoard[j] = { index: j, player, sequence: 0 }
            if (checkWinner(nextBoard, j)) winningMoves++
          }
        }
        if (winningMoves >= 2) return i
      }
    }
    return null
  }

  const findBestOpportunity = (board: (null | Move)[], emptyCells: number[]): number => {
    let bestScore = -Infinity
    let bestMove = emptyCells[0]

    for (const cell of emptyCells) {
      const score = evaluateMove(board, cell, 'white')
      if (score > bestScore) {
        bestScore = score
        bestMove = cell
      }
    }

    return bestMove
  }

  const evaluateMove = (board: (null | Move)[], move: number, player: 'black' | 'white'): number => {
    const opponent = player === 'black' ? 'white' : 'black'
    const testBoard = [...board]
    testBoard[move] = { index: move, player, sequence: 0 }

    let score = 0
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]

    for (const [dx, dy] of directions) {
      score += evaluateDirection(testBoard, move, player, dx, dy)
      score += evaluateDirection(testBoard, move, player, -dx, -dy)
    }

    // Subtract opponent's potential score to block their moves
    for (const [dx, dy] of directions) {
      score -= evaluateDirection(testBoard, move, opponent, dx, dy) * 0.8
      score -= evaluateDirection(testBoard, move, opponent, -dx, -dy) * 0.8
    }

    return score
  }

  const evaluateDirection = (board: (null | Move)[], start: number, player: 'black' | 'white', dx: number, dy: number): number => {
    let count = 0
    let open = 0
    let x = start % BOARD_SIZE
    let y = Math.floor(start / BOARD_SIZE)

    for (let i = 1; i < 5; i++) {
      x += dx
      y += dy
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) break
      const cell = board[y * BOARD_SIZE + x]
      if (cell?.player === player) count++
      else if (!cell) {
        open++
        break
      } else break
    }

    // Reset to start position and check the other direction
    x = start % BOARD_SIZE
    y = Math.floor(start / BOARD_SIZE)
    for (let i = 1; i < 5; i++) {
      x -= dx
      y -= dy
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) break
      const cell = board[y * BOARD_SIZE + x]
      if (cell?.player === player) count++
      else if (!cell) {
        open++
        break
      } else break
    }

    // Score based on the number of pieces in a row and openness
    if (count >= 4) return 1000000 // Winning move
    if (count === 3 && open === 2) return 50000 // Open four
    if (count === 3 && open === 1) return 10000 // Closed four
    if (count === 2 && open === 2) return 5000 // Open three
    if (count === 2 && open === 1) return 1000 // Closed three
    if (count === 1 && open === 2) return 100 // Open two
    if (count === 1 && open === 1) return 10 // Closed two
    return 1 // Any move is better than no move
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Gobang Game</h1>
      <div className="bg-amber-100 p-8 rounded-lg shadow-md">
        <Board board={board} onCellClick={handleCellClick} showSequence={showSequence} />
      </div>
      <div className="mt-4 text-xl">
        {winner ? (
          <p>{winner.charAt(0).toUpperCase() + winner.slice(1)} wins!</p>
        ) : isReplaying ? (
          <p>Replaying moves...</p>
        ) : isReplayComplete ? (
          <p>Replay complete. Click 'Reset Game' to start a new game or 'Replay' to watch again.</p>
        ) : (
          <p>Current player: {currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}{isAIMode && currentPlayer === 'white' ? ' (AI)' : ''}</p>
        )}
      </div>
      <div className="mt-4 flex space-x-4">
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={startAIGame}
          disabled={isReplaying || isAIMode}
        >
          Game with AI
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={resetGame}
          disabled={isReplaying}
        >
          Reset Game
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={replayGame}
          disabled={isReplaying || moveHistory.length === 0}
        >
          Replay
        </button>
      </div>
    </div>
  )
}

export default App