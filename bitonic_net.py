import numpy as np

def bitwiseXOR(i, j):
    return i ^ j

def bitwiseAND(i, j):
    return i & j

def citer(start, lambda_keep_going, lambda_next):
    # print(f'citer {start=} {lambda_keep_going=} {lambda_next=}')
    iter_val = start
    while lambda_keep_going(iter_val):
        yield iter_val
        iter_val = lambda_next(iter_val)


def main1():
    n = 16
    print(f'{n=}')
    # given an array arr of length n, this code sorts it in place
    # all indices run from 0 to n-1
    for k in citer(2, lambda k: k <= n, lambda k: k * 2):  # k is doubled every iteration
        print(f'== {k=}')
        for j in citer(k//2, lambda j: j > 0, lambda j: j // 2):  # j is halved at every iteration, with truncation of fractional parts
            print(f'== {j=}')
            for i in range(n):
                l = bitwiseXOR (i, j) # in C-like languages this is "i ^ j"
                if (l > i):
                    # if (  (bitwiseAND (i, k) == 0) and (arr[i] > arr[l])
                    #    or (bitwiseAND (i, k) != 0) and (arr[i] < arr[l]) )
                    # swap the elements arr[i] and arr[l]
                    if bitwiseAND (i, k) == 0:
                        print(f'{i} > {l}')
                    else:
                        print(f'{i} < {l}')

def bitonic_sort_pass_bitop(arr, k, j):
    result = np.zeros_like(arr)
    for i in range(arr.shape[0]):
        l = bitwiseXOR(i, j)
        i_and_k = bitwiseAND(i, k)
        max_il = max(arr[i], arr[l])
        min_il = min(arr[i], arr[l])
        if l > i:
            result[i] = min_il if i_and_k == 0 else max_il
        else:
            result[i] = max_il if i_and_k == 0 else min_il

        print(f'{i=} {l=} {arr[i]=} {arr[l]=} {bitwiseAND(i, k)=}  {result[i]=}')

    return result

def bitonic_sort_pass(arr, k, j):
    result = np.zeros_like(arr)
    for i in range(arr.shape[0]):
        is_green_box = (i // k) % 2 == 1
        is_top_of_red_box = (i % (j * 2)) < j  # j is size of half of red box.
        if is_green_box:
            compare_dir = -1 if is_top_of_red_box else +1
            l = i - j * compare_dir
        else:
            compare_dir = +1 if is_top_of_red_box else -1
            l = i + j * compare_dir

        bitwise_l = bitwiseXOR(i, j)
        max_il = max(arr[i], arr[l])
        min_il = min(arr[i], arr[l])
        result[i] = min_il if compare_dir > 0 else max_il

        print(f'{i=} {is_green_box=} {is_top_of_red_box=} {compare_dir=} {bitwise_l=} {l=} {arr[i]=} {arr[l]=} {bitwiseAND(i, k)=}  {result[i]=}')
        assert(l == bitwise_l)

    return result

def main():
    n = 16
    print(f'{n=}')
    np.random.seed(1)
    arr = np.array(list(range(n)))
    np.random.shuffle(arr)
    # arr = arr.reshape(1, -1)
    print(f'before pass {arr.shape=} {arr=}')
    for k in citer(2, lambda k: k <= n, lambda k: k * 2):  # k is doubled every iteration
        print(f'== {k=}')
        for j in citer(k//2, lambda j: j > 0, lambda j: j // 2):  # j is halved at every iteration, with truncation of fractional parts
            print(f'== {j=}')
            arr = bitonic_sort_pass(arr, k=k, j=j)
            print(f'after pass  {arr.shape=} {arr=}')


if __name__ == '__main__':
    main()