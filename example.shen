(define super
  [Value Succ End] Action Combine Zero ->
    (if (End Value)
        Zero
        (Combine (Action Value)
                 (super [(Succ Value) Succ End]
                        Action Combine Zero))))

(define for
  Stream Action -> (super Stream Action do 0))

(define filter
  Stream Condition ->
    (super Stream
         (/. Val (if (Condition Val) [Val] []))
         append
         []))

(for [0 (+ 1) (= 10)] print)

(filter [0 (+ 1) (= 100)]
        (/. X (integer? (/ X 3))))
